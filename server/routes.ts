import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertTenderSchema, insertContractSchema, insertServiceOrderSchema, insertDepartmentSchema, insertActivitySchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Error handling middleware for zod validation errors
  const handleZodError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ error: validationError.message });
    }
    throw err;
  };

  // Check authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ error: "Unauthorized" });
  };

  // Role-based authorization middleware
  const hasRole = (roles: string[]) => {
    return (req: Request, res: Response, next: Function) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const userRole = req.user?.role;
      if (!userRole || !roles.includes(userRole)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }
      
      next();
    };
  };

  // Department routes
  app.get("/api/departments", isAuthenticated, async (req, res) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve departments" });
    }
  });

  app.get("/api/departments/:id", isAuthenticated, async (req, res) => {
    try {
      const department = await storage.getDepartment(Number(req.params.id));
      if (!department) {
        return res.status(404).json({ error: "Department not found" });
      }
      res.json(department);
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve department" });
    }
  });

  app.post("/api/departments", hasRole(['supervisor', 'markets']), async (req, res) => {
    try {
      const validatedData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(validatedData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user!.id,
        action: "created",
        entityType: "department",
        entityId: department.id,
        details: `Department "${department.name}" created`
      });
      
      res.status(201).json(department);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  // Tender routes
  app.get("/api/tenders", isAuthenticated, async (req, res) => {
    try {
      const { department, status } = req.query;
      
      let tenders;
      if (department) {
        tenders = await storage.getTendersByDepartment(Number(department));
      } else if (status) {
        tenders = await storage.getTendersByStatus(status as string);
      } else {
        tenders = await storage.getAllTenders();
      }
      
      res.json(tenders);
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve tenders" });
    }
  });

  app.get("/api/tenders/:id", isAuthenticated, async (req, res) => {
    try {
      const tender = await storage.getTender(Number(req.params.id));
      if (!tender) {
        return res.status(404).json({ error: "Tender not found" });
      }
      res.json(tender);
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve tender" });
    }
  });

  app.post("/api/tenders", isAuthenticated, async (req, res) => {
    try {
      // Add created by ID from the authenticated user
      const data = {
        ...req.body,
        createdById: req.user!.id,
      };
      
      const validatedData = insertTenderSchema.parse(data);
      const tender = await storage.createTender(validatedData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user!.id,
        action: "created",
        entityType: "tender",
        entityId: tender.id,
        details: `Tender "${tender.title}" created`
      });
      
      res.status(201).json(tender);
    } catch (err) {
      console.error("Tender creation error:", err);
      handleZodError(err, res);
    }
  });

  app.put("/api/tenders/:id", isAuthenticated, async (req, res) => {
    try {
      const tenderId = Number(req.params.id);
      const tender = await storage.getTender(tenderId);
      
      if (!tender) {
        return res.status(404).json({ error: "Tender not found" });
      }
      
      // Check if user has permission to update this tender
      const userRole = req.user!.role;
      const userDeptId = req.user!.departmentId;
      
      if (userRole !== 'supervisor' && userRole !== 'markets' && 
          userRole !== 'controller' && 
          (userRole !== 'operational' || tender.departmentId !== userDeptId)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }
      
      const updatedTender = await storage.updateTender(tenderId, req.body);
      
      // Log activity
      await storage.createActivity({
        userId: req.user!.id,
        action: "updated",
        entityType: "tender",
        entityId: tenderId,
        details: `Tender "${updatedTender!.title}" updated - Status: ${updatedTender!.status}`
      });
      
      res.json(updatedTender);
    } catch (err) {
      res.status(500).json({ error: "Failed to update tender" });
    }
  });

  // Contract routes
  app.get("/api/contracts", isAuthenticated, async (req, res) => {
    try {
      const { tenderId } = req.query;
      
      let contracts;
      if (tenderId) {
        contracts = await storage.getContractsByTender(Number(tenderId));
      } else {
        contracts = await storage.getAllContracts();
      }
      
      res.json(contracts);
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve contracts" });
    }
  });

  app.get("/api/contracts/:id", isAuthenticated, async (req, res) => {
    try {
      const contract = await storage.getContract(Number(req.params.id));
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve contract" });
    }
  });

  app.post("/api/contracts", hasRole(['markets', 'supervisor']), async (req, res) => {
    try {
      const validatedData = insertContractSchema.parse(req.body);
      const contract = await storage.createContract(validatedData);
      
      // Update related tender status
      const tender = await storage.getTender(contract.tenderId);
      if (tender) {
        await storage.updateTender(tender.id, { status: 'awarded' });
      }
      
      // Log activity
      await storage.createActivity({
        userId: req.user!.id,
        action: "created",
        entityType: "contract",
        entityId: contract.id,
        details: `Contract for tender ${contract.tenderId} awarded to "${contract.supplierName}"`
      });
      
      res.status(201).json(contract);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.put("/api/contracts/:id", hasRole(['markets', 'supervisor']), async (req, res) => {
    try {
      const contractId = Number(req.params.id);
      const updatedContract = await storage.updateContract(contractId, req.body);
      
      if (!updatedContract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      // Log activity
      await storage.createActivity({
        userId: req.user!.id,
        action: "updated",
        entityType: "contract",
        entityId: contractId,
        details: `Contract ${contractId} updated - Status: ${updatedContract.status}`
      });
      
      res.json(updatedContract);
    } catch (err) {
      res.status(500).json({ error: "Failed to update contract" });
    }
  });

  // Service Order routes
  app.get("/api/service-orders", isAuthenticated, async (req, res) => {
    try {
      const { contractId } = req.query;
      
      let serviceOrders;
      if (contractId) {
        serviceOrders = await storage.getServiceOrdersByContract(Number(contractId));
      } else {
        serviceOrders = await storage.getAllServiceOrders();
      }
      
      res.json(serviceOrders);
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve service orders" });
    }
  });

  app.get("/api/service-orders/:id", isAuthenticated, async (req, res) => {
    try {
      const serviceOrder = await storage.getServiceOrder(Number(req.params.id));
      if (!serviceOrder) {
        return res.status(404).json({ error: "Service order not found" });
      }
      res.json(serviceOrder);
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve service order" });
    }
  });

  app.post("/api/service-orders", hasRole(['operational', 'markets', 'supervisor']), async (req, res) => {
    try {
      const validatedData = insertServiceOrderSchema.parse(req.body);
      const serviceOrder = await storage.createServiceOrder(validatedData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user!.id,
        action: "created",
        entityType: "service_order",
        entityId: serviceOrder.id,
        details: `Service order "${serviceOrder.reference}" created for contract ${serviceOrder.contractId}`
      });
      
      res.status(201).json(serviceOrder);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.put("/api/service-orders/:id", hasRole(['operational', 'markets', 'supervisor']), async (req, res) => {
    try {
      const serviceOrderId = Number(req.params.id);
      const updatedServiceOrder = await storage.updateServiceOrder(serviceOrderId, req.body);
      
      if (!updatedServiceOrder) {
        return res.status(404).json({ error: "Service order not found" });
      }
      
      // Log activity
      await storage.createActivity({
        userId: req.user!.id,
        action: "updated",
        entityType: "service_order",
        entityId: serviceOrderId,
        details: `Service order "${updatedServiceOrder.reference}" updated - Status: ${updatedServiceOrder.status}`
      });
      
      res.json(updatedServiceOrder);
    } catch (err) {
      res.status(500).json({ error: "Failed to update service order" });
    }
  });

  // Activity routes
  app.get("/api/activities", isAuthenticated, async (req, res) => {
    try {
      const { limit } = req.query;
      const activities = await storage.getRecentActivities(Number(limit) || 10);
      res.json(activities);
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve activities" });
    }
  });

  app.get("/api/activities/:entityType/:entityId", isAuthenticated, async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const activities = await storage.getActivitiesByEntityType(entityType, Number(entityId));
      res.json(activities);
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve activities" });
    }
  });

  // User routes (for admin purposes)
  app.get("/api/users", hasRole(['supervisor', 'markets']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve users" });
    }
  });

  // Stats for dashboard
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      const allTenders = await storage.getAllTenders();
      const allContracts = await storage.getAllContracts();
      
      // Count tenders by status
      const tendersByStatus = {
        draft: allTenders.filter(t => t.status === 'draft').length,
        pending_review: allTenders.filter(t => t.status === 'pending_review').length,
        review: allTenders.filter(t => t.status === 'review').length,
        approved: allTenders.filter(t => t.status === 'approved').length,
        published: allTenders.filter(t => t.status === 'published').length,
        awarded: allTenders.filter(t => t.status === 'awarded').length,
        rejected: allTenders.filter(t => t.status === 'rejected').length,
      };
      
      // Count tenders by department
      const departments = await storage.getAllDepartments();
      const tendersByDepartment = departments.map(dept => {
        return {
          departmentId: dept.id,
          departmentName: dept.name,
          tenderCount: allTenders.filter(t => t.departmentId === dept.id).length,
          tendersByStatus: {
            draft: allTenders.filter(t => t.departmentId === dept.id && t.status === 'draft').length,
            published: allTenders.filter(t => t.departmentId === dept.id && t.status === 'published').length,
            awarded: allTenders.filter(t => t.departmentId === dept.id && t.status === 'awarded').length,
            review: allTenders.filter(t => t.departmentId === dept.id && (t.status === 'review' || t.status === 'pending_review')).length,
          }
        };
      });
      
      const stats = {
        activeTenders: allTenders.length,
        pendingApprovals: allTenders.filter(t => t.status === 'pending_review' || t.status === 'review').length,
        publishedTenders: allTenders.filter(t => t.status === 'published').length,
        awardedContracts: allContracts.length,
        tendersByStatus,
        tendersByDepartment
      };
      
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
