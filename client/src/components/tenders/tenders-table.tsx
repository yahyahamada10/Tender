import { useQuery } from "@tanstack/react-query";
import { Tender } from "@shared/schema";
import { Link } from "wouter";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, Edit, CheckCircle, Inbox, Send, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { format } from "date-fns";

interface TendersTableProps {
  title: string;
  filterByDepartment?: boolean;
  filterByStatus?: boolean;
  showActions?: boolean;
}

export function TendersTable({ 
  title, 
  filterByDepartment = true, 
  filterByStatus = true,
  showActions = true
}: TendersTableProps) {
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data: tenders, isLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tenders", departmentFilter, statusFilter],
  });

  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!tenders) {
    return <div>No tenders found</div>;
  }

  // Filter tenders
  let filteredTenders = [...tenders];
  
  if (departmentFilter && departmentFilter !== "all") {
    filteredTenders = filteredTenders.filter(tender => 
      tender.departmentId === parseInt(departmentFilter)
    );
  }
  
  if (statusFilter && statusFilter !== "all") {
    filteredTenders = filteredTenders.filter(tender => 
      tender.status === statusFilter
    );
  }
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredTenders = filteredTenders.filter(tender => 
      tender.title.toLowerCase().includes(query) || 
      tender.reference.toLowerCase().includes(query)
    );
  }

  // Pagination
  const totalPages = Math.ceil(filteredTenders.length / itemsPerPage);
  const paginatedTenders = filteredTenders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      draft: { variant: "outline", label: "Draft" },
      pending_review: { variant: "secondary", label: "Pending" },
      review: { variant: "secondary", label: "Review" },
      approved: { variant: "default", label: "Approved" },
      published: { variant: "default", label: "Published" },
      awarded: { variant: "default", label: "Awarded" },
      rejected: { variant: "destructive", label: "Rejected" },
    };

    const { variant, label } = statusClasses[status] || { variant: "outline", label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getDepartmentName = (departmentId: number) => {
    if (!departments) return "Unknown";
    const department = departments.find(d => d.id === departmentId);
    return department ? department.name : "Unknown";
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <h2 className="text-lg font-source font-semibold text-primary">{title}</h2>
          
          <div className="flex flex-wrap items-center mt-4 md:mt-0 space-y-2 md:space-y-0 space-x-0 md:space-x-3">
            {filterByDepartment && (
              <div className="relative">
                <Select 
                  value={departmentFilter} 
                  onValueChange={setDepartmentFilter}
                >
                  <SelectTrigger className="text-sm h-9 w-[180px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments?.map(dept => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {filterByStatus && (
              <div className="relative">
                <Select 
                  value={statusFilter} 
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="text-sm h-9 w-[180px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="awarded">Awarded</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="relative">
              <Input 
                type="text" 
                placeholder="Search tenders..." 
                className="text-sm h-9 w-[220px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-primary">
            <TableRow>
              <TableHead className="text-white">Reference</TableHead>
              <TableHead className="text-white">Tender Title</TableHead>
              <TableHead className="text-white">Department</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Publication Date</TableHead>
              <TableHead className="text-white">Deadline</TableHead>
              {showActions && <TableHead className="text-white text-center">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTenders.length > 0 ? (
              paginatedTenders.map((tender) => (
                <TableRow key={tender.id}>
                  <TableCell className="font-medium">
                    <Link href={`/tenders/${tender.id}`} className="text-accent hover:underline">
                      {tender.reference}
                    </Link>
                  </TableCell>
                  <TableCell>{tender.title}</TableCell>
                  <TableCell>{getDepartmentName(tender.departmentId)}</TableCell>
                  <TableCell>{getStatusBadge(tender.status)}</TableCell>
                  <TableCell>
                    {tender.publicationDate 
                      ? format(new Date(tender.publicationDate), "MMM d, yyyy") 
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {tender.deadline 
                      ? format(new Date(tender.deadline), "MMM d, yyyy") 
                      : "-"}
                  </TableCell>
                  {showActions && (
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/tenders/${tender.id}`}>
                            <Eye className="h-4 w-4 text-accent" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4 text-gray-600" />
                        </Button>
                        
                        {tender.status === "draft" && (
                          <Button variant="ghost" size="icon" title="Submit for Review">
                            <Send className="h-4 w-4 text-success" />
                          </Button>
                        )}
                        
                        {(tender.status === "pending_review" || tender.status === "review") && (
                          <Button variant="ghost" size="icon" title="Approve">
                            <CheckCircle className="h-4 w-4 text-success" />
                          </Button>
                        )}
                        
                        {tender.status === "published" && (
                          <Button variant="ghost" size="icon" title="Submissions">
                            <Inbox className="h-4 w-4 text-warning" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={showActions ? 7 : 6} className="text-center py-8">
                  No tenders found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredTenders.length)}
                </span> of <span className="font-medium">{filteredTenders.length}</span> results
              </p>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(i + 1);
                      }}
                      isActive={currentPage === i + 1}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
}
