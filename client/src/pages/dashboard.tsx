import { useState } from "react";
import { Link } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { ProcessStatus } from "@/components/dashboard/process-status";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { TendersTable } from "@/components/tenders/tenders-table";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - hidden on mobile by default */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-background">
          {/* Dashboard Title and Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-source font-bold text-primary">Dashboard</h1>
              <p className="text-sm text-gray-600">Overview of all tender processes and activities</p>
            </div>
            
            <div className="flex flex-wrap items-center mt-4 md:mt-0 space-x-0 md:space-x-3">
              <div className="flex items-center">
                <select className="text-sm border rounded-md px-3 py-1.5 bg-white">
                  <option>Last 30 days</option>
                  <option>This month</option>
                  <option>Last quarter</option>
                  <option>This year</option>
                  <option>Custom range</option>
                </select>
              </div>
              
              <Button asChild>
                <Link href="/tenders/new">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  New Tender
                </Link>
              </Button>
            </div>
          </div>
          
          {/* KPI Cards */}
          <KpiCards />
          
          {/* Process Status & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <ProcessStatus />
            <RecentActivity />
          </div>
          
          {/* Pending Tenders Table */}
          <TendersTable 
            title="Pending Tenders" 
            filterByDepartment={true}
            filterByStatus={true}
            showActions={true}
          />
        </main>
      </div>
    </div>
  );
}
