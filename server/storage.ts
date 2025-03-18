import { 
  users, User, InsertUser, 
  departments, Department, InsertDepartment, 
  directions, Direction, InsertDirection,
  tenders, Tender, InsertTender, 
  contracts, Contract, InsertContract, 
  serviceOrders, ServiceOrder, InsertServiceOrder, 
  activities, Activity, InsertActivity,
  projects, Project, InsertProject,
  receptions, Reception, InsertReception,
  invoices, Invoice, InsertInvoice
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

// Create Memory Store for session
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Department operations
  getDepartment(id: number): Promise<Department | undefined>;
  getDepartmentByName(name: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  getAllDepartments(): Promise<Department[]>;

  // Tender operations
  getTender(id: number): Promise<Tender | undefined>;
  getTenderByReference(reference: string): Promise<Tender | undefined>;
  createTender(tender: InsertTender): Promise<Tender>;
  updateTender(id: number, tender: Partial<InsertTender>): Promise<Tender | undefined>;
  getAllTenders(): Promise<Tender[]>;
  getTendersByDepartment(departmentId: number): Promise<Tender[]>;
  getTendersByStatus(status: string): Promise<Tender[]>;

  // Contract operations
  getContract(id: number): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  getAllContracts(): Promise<Contract[]>;
  getContractsByTender(tenderId: number): Promise<Contract[]>;

  // Service Order operations
  getServiceOrder(id: number): Promise<ServiceOrder | undefined>;
  createServiceOrder(serviceOrder: InsertServiceOrder): Promise<ServiceOrder>;
  updateServiceOrder(id: number, serviceOrder: Partial<InsertServiceOrder>): Promise<ServiceOrder | undefined>;
  getAllServiceOrders(): Promise<ServiceOrder[]>;
  getServiceOrdersByContract(contractId: number): Promise<ServiceOrder[]>;

  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivitiesByEntityType(entityType: string, entityId: number): Promise<Activity[]>;
  getRecentActivities(limit: number): Promise<Activity[]>;

  // Session store
  sessionStore: session.Store; 
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private departments: Map<number, Department>;
  private tenders: Map<number, Tender>;
  private contracts: Map<number, Contract>;
  private serviceOrders: Map<number, ServiceOrder>;
  private activities: Map<number, Activity>;
  currentUserId: number;
  currentDepartmentId: number;
  currentTenderId: number;
  currentContractId: number;
  currentServiceOrderId: number;
  currentActivityId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.departments = new Map();
    this.tenders = new Map();
    this.contracts = new Map();
    this.serviceOrders = new Map();
    this.activities = new Map();
    this.currentUserId = 1;
    this.currentDepartmentId = 1;
    this.currentTenderId = 1;
    this.currentContractId = 1;
    this.currentServiceOrderId = 1;
    this.currentActivityId = 1;

    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });

    // Initialize with demo data
    this.initData();
  }

  private async initData() {
    // Create demo user
    const hashedPassword = "$6367c48dd193d56ea7b0baad25b19455e529f5ee.2a31ab3b15bb2e2a5e9a1a8f7ea8a0b1"; // "motdepasse" with salt
    const demoUser: InsertUser = {
      username: "demo",
      password: hashedPassword,
      email: "demo@example.com",
      fullName: "Demo User",
      role: "supervisor",
      departmentId: 1,
    };
    await this.createUser(demoUser);
    console.log("Demo user created with username: demo and password: motdepasse");

    // Create departments
    const departments = [
      { name: "IT", description: "Information Technology" },
      { name: "Finance", description: "Financial Services" },
      { name: "HR", description: "Human Resources" },
      { name: "Operations", description: "Operations Management" },
    ];

    for (const dept of departments) {
      await this.createDepartment(dept);
    }

    // Create a few tenders
    const tenders = [
      {
        departmentId: 1,
        status: "published",
        reference: "IT-2025-001",
        title: "Équipement réseau",
        createdById: 1,
        publicationDate: new Date(),
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        description: "Appel d'offres pour l'acquisition d'équipements réseau pour le datacenter",
      },
      {
        departmentId: 2,
        status: "pending_review",
        reference: "FIN-2025-001",
        title: "Audit financier",
        createdById: 1,
        publicationDate: null,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        description: "Services d'audit financier pour l'exercice 2025",
      },
      {
        departmentId: 3,
        status: "draft",
        reference: "HR-2025-001",
        title: "Formation du personnel",
        createdById: 1,
        publicationDate: null,
        deadline: null,
        description: "Programme de formation pour le personnel administratif",
      },
    ];

    for (const tender of tenders) {
      await this.createTender(tender);
    }

    // Create a contract
    await this.createContract({
      status: "active",
      title: "Contrat équipement réseau",
      tenderId: 1,
      supplierName: "NetworkPro SAS",
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days from now
      value: "75000€",
    });

    // Create service orders
    await this.createServiceOrder({
      contractId: 1,
      reference: "OS-2025-001",
      description: "Installation de commutateurs réseau",
      status: "completed",
      issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      completionDate: new Date(),
      amount: "25000€",
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }

  async getDepartmentByName(name: string): Promise<Department | undefined> {
    return Array.from(this.departments.values()).find(dept => dept.name === name);
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = this.currentDepartmentId++;
    const department: Department = { ...insertDepartment, id };
    this.departments.set(id, department);
    return department;
  }

  async updateDepartment(id: number, departmentUpdate: Partial<InsertDepartment>): Promise<Department | undefined> {
    const department = this.departments.get(id);
    if (!department) return undefined;

    const updatedDepartment = { ...department, ...departmentUpdate };
    this.departments.set(id, updatedDepartment);
    return updatedDepartment;
  }

  async getAllDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async getTender(id: number): Promise<Tender | undefined> {
    return this.tenders.get(id);
  }

  async getTenderByReference(reference: string): Promise<Tender | undefined> {
    return Array.from(this.tenders.values()).find(tender => tender.reference === reference);
  }

  async createTender(insertTender: InsertTender): Promise<Tender> {
    const id = this.currentTenderId++;
    const tender: Tender = { 
      ...insertTender, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tenders.set(id, tender);
    return tender;
  }

  async updateTender(id: number, tenderUpdate: Partial<InsertTender>): Promise<Tender | undefined> {
    const tender = this.tenders.get(id);
    if (!tender) return undefined;

    const updatedTender = { 
      ...tender, 
      ...tenderUpdate,
      updatedAt: new Date() 
    };
    this.tenders.set(id, updatedTender);
    return updatedTender;
  }

  async getAllTenders(): Promise<Tender[]> {
    return Array.from(this.tenders.values());
  }

  async getTendersByDepartment(departmentId: number): Promise<Tender[]> {
    return Array.from(this.tenders.values()).filter(
      tender => tender.departmentId === departmentId
    );
  }

  async getTendersByStatus(status: string): Promise<Tender[]> {
    return Array.from(this.tenders.values()).filter(
      tender => tender.status === status
    );
  }

  async getContract(id: number): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const id = this.currentContractId++;
    const contract: Contract = { 
      ...insertContract, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.contracts.set(id, contract);
    return contract;
  }

  async updateContract(id: number, contractUpdate: Partial<InsertContract>): Promise<Contract | undefined> {
    const contract = this.contracts.get(id);
    if (!contract) return undefined;

    const updatedContract = { 
      ...contract, 
      ...contractUpdate,
      updatedAt: new Date() 
    };
    this.contracts.set(id, updatedContract);
    return updatedContract;
  }

  async getAllContracts(): Promise<Contract[]> {
    return Array.from(this.contracts.values());
  }

  async getContractsByTender(tenderId: number): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter(
      contract => contract.tenderId === tenderId
    );
  }

  async getServiceOrder(id: number): Promise<ServiceOrder | undefined> {
    return this.serviceOrders.get(id);
  }

  async createServiceOrder(insertServiceOrder: InsertServiceOrder): Promise<ServiceOrder> {
    const id = this.currentServiceOrderId++;
    const serviceOrder: ServiceOrder = { 
      ...insertServiceOrder, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.serviceOrders.set(id, serviceOrder);
    return serviceOrder;
  }

  async updateServiceOrder(id: number, serviceOrderUpdate: Partial<InsertServiceOrder>): Promise<ServiceOrder | undefined> {
    const serviceOrder = this.serviceOrders.get(id);
    if (!serviceOrder) return undefined;

    const updatedServiceOrder = { 
      ...serviceOrder, 
      ...serviceOrderUpdate,
      updatedAt: new Date() 
    };
    this.serviceOrders.set(id, updatedServiceOrder);
    return updatedServiceOrder;
  }

  async getAllServiceOrders(): Promise<ServiceOrder[]> {
    return Array.from(this.serviceOrders.values());
  }

  async getServiceOrdersByContract(contractId: number): Promise<ServiceOrder[]> {
    return Array.from(this.serviceOrders.values()).filter(
      serviceOrder => serviceOrder.contractId === contractId
    );
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = { 
      ...insertActivity, 
      id,
      timestamp: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  async getActivitiesByEntityType(entityType: string, entityId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.entityType === entityType && activity.entityId === entityId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getRecentActivities(limit: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();