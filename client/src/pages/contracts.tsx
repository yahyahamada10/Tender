import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { PlusIcon, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Contract } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Contracts() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const { data: contracts, isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

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
              <h1 className="text-2xl font-source font-bold text-primary">Contracts</h1>
              <p className="text-sm text-gray-600">Manage awarded contracts and suppliers</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                New Contract
              </Button>
            </div>
          </div>

          {/* Contracts List */}
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contracts && contracts.length > 0 ? (
                contracts.map((contract) => (
                  <Card key={contract.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{contract.title}</CardTitle>
                          <CardDescription>Contract #{contract.id}</CardDescription>
                        </div>
                        <Badge
                          variant={
                            contract.status === "active" 
                              ? "default" 
                              : contract.status === "completed" 
                                ? "outline" 
                                : "secondary"
                          }
                        >
                          {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Supplier:</span>
                          <span className="font-medium">{contract.supplierName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Value:</span>
                          <span className="font-medium">{contract.value || "Not specified"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Start Date:</span>
                          <span className="font-medium">
                            {contract.startDate 
                              ? format(new Date(contract.startDate), "MMM d, yyyy") 
                              : "Not set"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">End Date:</span>
                          <span className="font-medium">
                            {contract.endDate 
                              ? format(new Date(contract.endDate), "MMM d, yyyy") 
                              : "Not set"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm">View Details</Button>
                      <Button variant="outline" size="sm">Service Orders</Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <p className="text-muted-foreground mb-4">No contracts found</p>
                      <Button>Create First Contract</Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
