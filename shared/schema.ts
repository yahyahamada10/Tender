import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User and Authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(), // 'technical', 'markets_procurement', 'markets_execution', 'ordonnancement', 'supervisor', 'admin'
  departmentId: integer("department_id"),
  directionId: integer("direction_id"),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  role: true,
  departmentId: true,
  directionId: true,
  isApproved: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Directions
export const directions = pgTable("directions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  abbreviation: text("abbreviation").notNull(),
  description: text("description"),
});

export const insertDirectionSchema = createInsertSchema(directions).pick({
  name: true,
  abbreviation: true,
  description: true,
});

// Departments
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  directionId: integer("direction_id").notNull(),
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  description: true,
  directionId: true,
});

// Tender and Workflow
export const tenders = pgTable("tenders", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull(), // Status according to tender workflow
  departmentId: integer("department_id").notNull(),
  directionId: integer("direction_id").notNull(),
  projectId: integer("project_id"),
  createdById: integer("created_by_id").notNull(),
  assignedToId: integer("assigned_to_id"),
  publicationDate: timestamp("publication_date"),
  deadline: timestamp("deadline"),
  budget: text("budget"),
  documents: json("documents").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTenderSchema = createInsertSchema(tenders)
  .pick({
    reference: true,
    title: true,
    description: true,
    status: true,
    departmentId: true,
    directionId: true,
    projectId: true,
    createdById: true,
    assignedToId: true,
    publicationDate: true,
    deadline: true,
    budget: true,
    documents: true,
  })
  .extend({
    // Override the publicationDate and deadline fields to accept strings as input
    publicationDate: z.string().optional().transform(val => val ? new Date(val) : null),
    deadline: z.string().optional().transform(val => val ? new Date(val) : null),
  });

// Contracts
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  tenderId: integer("tender_id").notNull(),
  title: text("title").notNull(),
  supplierName: text("supplier_name").notNull(),
  status: text("status").notNull(), // 'draft', 'active', 'completed', 'cancelled'
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  value: text("value"),
  documents: json("documents").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContractSchema = createInsertSchema(contracts)
  .pick({
    tenderId: true,
    title: true,
    supplierName: true,
    status: true,
    startDate: true,
    endDate: true,
    value: true,
    documents: true,
  })
  .extend({
    // Override date fields to accept strings as input
    startDate: z.string().optional().transform(val => val ? new Date(val) : null),
    endDate: z.string().optional().transform(val => val ? new Date(val) : null),
  });

// Service Orders
export const serviceOrders = pgTable("service_orders", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  reference: text("reference").notNull(),
  description: text("description"),
  status: text("status").notNull(), // 'pending', 'in_progress', 'completed', 'cancelled'
  issuedDate: timestamp("issued_date").notNull(),
  completionDate: timestamp("completion_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertServiceOrderSchema = createInsertSchema(serviceOrders)
  .pick({
    contractId: true,
    reference: true,
    description: true,
    status: true,
    issuedDate: true,
    completionDate: true,
  })
  .extend({
    // Override date fields to accept strings as input
    issuedDate: z.string().transform(val => new Date(val)),
    completionDate: z.string().optional().transform(val => val ? new Date(val) : null),
  });

// Activities for audit trail
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // 'tender', 'contract', 'service_order'
  entityId: integer("entity_id").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  identifier: text("identifier").notNull().unique(),
  title: text("title").notNull(),
  directionId: integer("direction_id").notNull(),
  departmentId: integer("department_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects)
  .pick({
    identifier: true,
    title: true,
    directionId: true,
    departmentId: true,
    startDate: true,
  })
  .extend({
    startDate: z.string().transform(val => new Date(val)),
  });

// Receptions
export const receptions = pgTable("receptions", {
  id: serial("id").primaryKey(),
  identifier: text("identifier").notNull().unique(),
  title: text("title").notNull(),
  contractId: integer("contract_id").notNull(),
  type: text("type").notNull(), // 'partial' or 'total'
  receptionDate: timestamp("reception_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReceptionSchema = createInsertSchema(receptions)
  .pick({
    identifier: true,
    title: true,
    contractId: true,
    type: true,
    receptionDate: true,
  })
  .extend({
    receptionDate: z.string().transform(val => new Date(val)),
  });

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  identifier: text("identifier").notNull().unique(),
  supplierName: text("supplier_name").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  title: text("title").notNull(),
  contractId: integer("contract_id").notNull(),
  receptionId: integer("reception_id"),
  invoiceDate: timestamp("invoice_date").notNull(),
  receivedDate: timestamp("received_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices)
  .pick({
    identifier: true,
    supplierName: true,
    invoiceNumber: true,
    title: true,
    contractId: true,
    receptionId: true,
    invoiceDate: true,
    receivedDate: true,
  })
  .extend({
    invoiceDate: z.string().transform(val => new Date(val)),
    receivedDate: z.string().transform(val => new Date(val)),
  });

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  action: true,
  entityType: true,
  entityId: true,
  details: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Direction = typeof directions.$inferSelect;
export type InsertDirection = z.infer<typeof insertDirectionSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Tender = typeof tenders.$inferSelect;
export type InsertTender = z.infer<typeof insertTenderSchema>;

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;

export type ServiceOrder = typeof serviceOrders.$inferSelect;
export type InsertServiceOrder = z.infer<typeof insertServiceOrderSchema>;

export type Reception = typeof receptions.$inferSelect;
export type InsertReception = z.infer<typeof insertReceptionSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
