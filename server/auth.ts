import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Invalid stored password format");
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "tender-workflow-secret-key",
    resave: true,
    saveUninitialized: true,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Désactivé en développement
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      httpOnly: true
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      console.log(`Login attempt: ${username}`);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`User not found: ${username}`);
        return done(null, false);
      }
      
      const passwordMatch = await comparePasswords(password, user.password);
      console.log(`Password comparison result for ${username}: ${passwordMatch}`);
      
      if (!passwordMatch) {
        return done(null, false);
      } else {
        console.log(`Authentication successful for ${username}`);
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Create user activity
      await storage.createActivity({
        userId: user.id,
        action: "registered",
        entityType: "user",
        entityId: user.id,
        details: `User "${user.username}" registered`
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Sauvegarde explicite de la session
        req.session.save(err => {
          if (err) return next(err);
          const { password, ...userWithoutPassword } = user;
          res.status(201).json(userWithoutPassword);
        });
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe invalide" });
      }
      
      req.login(user, async (err) => {
        if (err) return next(err);
        
        // Sauvegarde explicite de la session
        req.session.save(async (err) => {
          if (err) return next(err);
          
          const { password, ...userWithoutPassword } = user;
          
          // Log login activity
          await storage.createActivity({
            userId: user.id,
            action: "logged_in",
            entityType: "user",
            entityId: user.id,
            details: `User "${user.username}" logged in`
          });
          
          res.status(200).json(userWithoutPassword);
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    // Log logout activity if user is authenticated
    if (req.isAuthenticated() && req.user) {
      storage.createActivity({
        userId: req.user.id,
        action: "logged_out",
        entityType: "user",
        entityId: req.user.id,
        details: `User "${req.user.username}" logged out`
      });
    }
    
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}
