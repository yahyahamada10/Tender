import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { PlusIcon, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ServiceOrder } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function ServiceOrders() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [contractFilter, setContractFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const { data: serviceOrders, isLoading } = useQuery<ServiceOrder[]>({
    queryKey: ["/api/service-orders", contractFilter],
  });

  const { data: contracts } = useQuery({
    queryKey: ["/api/contracts"],
  });

  const getContractTitle = (contractId: number) => {
    if (!contracts) return `Contract #${contractId}`;
    const contract = contracts.find(c => c.id === contractId);
    return contract ? contract.title : `Contract #${contractId}`;
  };

  // Filter service orders
  const filteredOrders = serviceOrders?.filter(order => {
    let matchesStatus = true;
    let matchesSearch = true;

    if (statusFilter !== "all") {
      matchesStatus = order.status === statusFilter;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matchesSearch = order.reference.toLowerCase().includes(query) || 
                     (order.description && order.description.toLowerCase().includes(query));
    }

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      in_progress: { variant: "default", label: "In Progress" },
      completed: { variant: "outline", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };

    const { variant, label } = statusConfig[status] || { variant: "outline", label: status };
    return <Badge variant={variant}>{label}</Badge>;
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
              <h1 className="text-2xl font-source font-bold text-primary">Service Orders</h1>
              <p className="text-sm text-gray-600">Manage service orders and delivery tracking</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                New Service Order
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="w-full md:w-auto">
                <Select 
                  value={statusFilter} 
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-auto">
                <Select 
                  value={contractFilter} 
                  onValueChange={setContractFilter}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="All Contracts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contracts</SelectItem>
                    {contracts?.map(contract => (
                      <SelectItem key={contract.id} value={contract.id.toString()}>
                        {contract.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Input 
                  placeholder="Search service orders..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Service Orders Table */}
          <div className="bg-white rounded-lg shadow">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-primary">
                    <TableRow>
                      <TableHead className="text-white">Reference</TableHead>
                      <TableHead className="text-white">Contract</TableHead>
                      <TableHead className="text-white">Description</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Issued Date</TableHead>
                      <TableHead className="text-white">Completion Date</TableHead>
                      <TableHead className="text-white text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders && filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.reference}</TableCell>
                          <TableCell>{getContractTitle(order.contractId)}</TableCell>
                          <TableCell className="max-w-xs truncate">{order.description || "-"}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>{format(new Date(order.issuedDate), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            {order.completionDate 
                              ? format(new Date(order.completionDate), "MMM d, yyyy") 
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">View</Button>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No service orders found matching your filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
