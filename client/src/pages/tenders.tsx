import { useState } from "react";
import { Link } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { TendersTable } from "@/components/tenders/tenders-table";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export default function Tenders() {
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
          {/* Page Title and Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-source font-bold text-primary">Tenders</h1>
              <p className="text-sm text-gray-600">Manage all tender processes and submissions</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <Button asChild>
                <Link href="/tenders/new">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  New Tender
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Tenders Table */}
          <TendersTable 
            title="All Tenders" 
            filterByDepartment={true}
            filterByStatus={true}
            showActions={true}
          />
        </main>
      </div>
    </div>
  );
}
