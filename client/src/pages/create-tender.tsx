import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAuth } from "@/hooks/use-auth";
import { TenderForm } from "@/components/tenders/tender-form";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";

export default function CreateTender() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Check if user has permission to create tenders
  const canCreateTender = user && (
    ['operational', 'markets', 'supervisor'].includes(user.role)
  );

  if (!canCreateTender) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to create tenders.</p>
          <Button asChild>
            <Link href="/tenders">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Tenders
            </Link>
          </Button>
        </div>
      </div>
    );
  }

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
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link href="/tenders">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Tenders
              </Link>
            </Button>
            
            <h1 className="text-2xl font-source font-bold text-primary">Create New Tender</h1>
            <p className="text-sm text-gray-600">Complete the form below to create a new tender</p>
          </div>

          {/* Tender Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <TenderForm />
          </div>
        </main>
      </div>
    </div>
  );
}
