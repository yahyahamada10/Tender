import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, FileText, Handshake, CheckSquare, Users, Building, Settings, 
  BarChart3, FileBarChart, LogOut
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const isActive = (path: string) => {
    return location === path;
  };

  const navItemClasses = (path: string) => 
    cn(
      "flex items-center px-6 py-3 text-sm",
      isActive(path) 
        ? "border-l-4 border-accent bg-accent/10 text-accent font-medium" 
        : "border-l-4 border-transparent hover:bg-accent/5"
    );

  // Show/hide menu items based on user role
  const canAccessAdmin = ['supervisor', 'markets'].includes(user.role);
  const canAccessReports = ['supervisor', 'markets', 'controller'].includes(user.role);

  return (
    <div className={cn("flex flex-col w-64 bg-primary text-white shadow-lg h-full", className)}>
      <div className="p-4 flex items-center justify-center border-b border-secondary">
        <h1 className="text-xl font-source font-bold">Tender Management</h1>
      </div>
      
      {/* User profile summary */}
      <div className="p-4 flex items-center border-b border-secondary">
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
          <span className="text-white font-bold">
            {user?.fullName
              ?.split(" ")
              .map((n) => n[0])
              .join("")}
          </span>
        </div>
        <div className="ml-3">
          <p className="font-semibold">{user.fullName}</p>
          <p className="text-xs opacity-75">
            {user.role === 'operational' && 'Operational Service'}
            {user.role === 'markets' && 'Markets Service'}
            {user.role === 'controller' && 'State Controller'}
            {user.role === 'supervisor' && 'Supervisor/Director'}
          </p>
        </div>
      </div>
      
      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-3 text-xs uppercase tracking-wider text-gray-400">Main</div>
        <Link href="/" className={navItemClasses("/")}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="ml-3">Dashboard</span>
        </Link>
        <Link href="/tenders" className={navItemClasses("/tenders")}>
          <FileText className="w-5 h-5" />
          <span className="ml-3">Tenders</span>
        </Link>
        <Link href="/contracts" className={navItemClasses("/contracts")}>
          <Handshake className="w-5 h-5" />
          <span className="ml-3">Contracts</span>
        </Link>
        <Link href="/service-orders" className={navItemClasses("/service-orders")}>
          <CheckSquare className="w-5 h-5" />
          <span className="ml-3">Service Orders</span>
        </Link>
        
        {canAccessAdmin && (
          <>
            <div className="px-4 mb-3 mt-6 text-xs uppercase tracking-wider text-gray-400">Administration</div>
            <Link href="/users" className={navItemClasses("/users")}>
              <Users className="w-5 h-5" />
              <span className="ml-3">Users</span>
            </Link>
            <Link href="/departments" className={navItemClasses("/departments")}>
              <Building className="w-5 h-5" />
              <span className="ml-3">Departments</span>
            </Link>
            <Link href="/settings" className={navItemClasses("/settings")}>
              <Settings className="w-5 h-5" />
              <span className="ml-3">Settings</span>
            </Link>
          </>
        )}
        
        {canAccessReports && (
          <>
            <div className="px-4 mb-3 mt-6 text-xs uppercase tracking-wider text-gray-400">Reports</div>
            <Link href="/analytics" className={navItemClasses("/analytics")}>
              <BarChart3 className="w-5 h-5" />
              <span className="ml-3">Analytics</span>
            </Link>
            <Link href="/reports" className={navItemClasses("/reports")}>
              <FileBarChart className="w-5 h-5" />
              <span className="ml-3">Reports</span>
            </Link>
          </>
        )}
      </nav>
      
      {/* Logout button */}
      <div className="p-4 border-t border-secondary">
        <button 
          onClick={() => logoutMutation.mutate()}
          className="flex items-center text-sm hover:text-accent"
          disabled={logoutMutation.isPending}
        >
          <LogOut className="w-5 h-5" />
          <span className="ml-3">
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </span>
        </button>
      </div>
    </div>
  );
}
