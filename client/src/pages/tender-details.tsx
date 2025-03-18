import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tender, Activity } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import {
  ChevronLeft,
  Loader2,
  FileText,
  Building,
  Calendar,
  Timer,
  DollarSign,
  User,
  FileCheck,
  Send,
  CheckCircle,
  XCircle,
  BellRing,
  Handshake,
  History,
  MessageSquare,
  PaperclipIcon,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";

export default function TenderDetails() {
  const { id } = useParams<{ id: string }>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [activeTab, setActiveTab] = useState("details");

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fetch tender details
  const { data: tender, isLoading: isLoadingTender } = useQuery<Tender>({
    queryKey: [`/api/tenders/${id}`],
  });

  // Fetch departments for displaying department name
  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
  });

  // Fetch activities related to this tender
  const { data: activities, isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: [`/api/activities/tender/${id}`],
  });

  // Function to determine if user can perform specific actions
  const canApprove = () => {
    if (!user || !tender) return false;
    
    // Markets service and controllers can approve pending reviews
    if (['markets', 'controller'].includes(user.role) && 
        ['pending_review', 'review'].includes(tender.status)) {
      return true;
    }
    
    // Supervisors can approve any tender
    if (user.role === 'supervisor') {
      return true;
    }
    
    return false;
  };

  const canReject = canApprove;

  const canSubmitForReview = () => {
    if (!user || !tender) return false;
    
    // Only draft tenders can be submitted for review
    if (tender.status !== 'draft') return false;
    
    // Department staff or supervisors can submit
    return user.departmentId === tender.departmentId || user.role === 'supervisor';
  };

  const canPublish = () => {
    if (!user || !tender) return false;
    
    // Only approved tenders can be published
    if (tender.status !== 'approved') return false;
    
    // Only markets service or supervisors can publish
    return ['markets', 'supervisor'].includes(user.role);
  };

  // Mutation for updating tender status
  const updateTenderMutation = useMutation({
    mutationFn: async ({ status, action }: { status: string, action: string }) => {
      const response = await apiRequest("PUT", `/api/tenders/${id}`, { status });
      
      // Also add a comment if there's one
      if (comment.trim()) {
        await apiRequest("POST", "/api/activities", {
          userId: user!.id,
          action: "added_comment",
          entityType: "tender",
          entityId: Number(id),
          details: comment
        });
      }
      
      return { updatedTender: await response.json(), action };
    },
    onSuccess: ({ action }) => {
      toast({
        title: "Success",
        description: `Tender ${action} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tenders/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/tender/${id}`] });
      setComment("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tender",
        variant: "destructive",
      });
    },
  });

  if (isLoadingTender) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-primary mb-4">Tender Not Found</h1>
        <p className="text-gray-600 mb-6">The tender you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button asChild>
          <Link href="/tenders">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Tenders
          </Link>
        </Button>
      </div>
    );
  }

  const getDepartmentName = (departmentId: number) => {
    if (!departments) return "Unknown Department";
    const department = departments.find(d => d.id === departmentId);
    return department ? department.name : "Unknown Department";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      draft: { variant: "outline", label: "Draft" },
      pending_review: { variant: "secondary", label: "Pending Review" },
      review: { variant: "secondary", label: "Under Review" },
      approved: { variant: "default", label: "Approved" },
      published: { variant: "default", label: "Published" },
      awarded: { variant: "default", label: "Awarded" },
      rejected: { variant: "destructive", label: "Rejected" },
    };

    const { variant, label } = statusConfig[status] || { variant: "outline", label: status };
    return <Badge variant={variant} className="ml-2">{label}</Badge>;
  };

  // Handle action buttons
  const handleSubmitForReview = () => {
    updateTenderMutation.mutate({ 
      status: "pending_review", 
      action: "submitted for review" 
    });
  };

  const handleApprove = () => {
    updateTenderMutation.mutate({ 
      status: "approved", 
      action: "approved" 
    });
  };

  const handleReject = () => {
    updateTenderMutation.mutate({ 
      status: "rejected", 
      action: "rejected" 
    });
  };

  const handlePublish = () => {
    updateTenderMutation.mutate({ 
      status: "published", 
      action: "published" 
    });
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
          {/* Back button and title */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link href="/tenders">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Tenders
              </Link>
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-2xl font-source font-bold text-primary">
                  {tender.reference}: {tender.title}
                </h1>
                {getStatusBadge(tender.status)}
              </div>
              
              <div className="flex space-x-2 mt-4 md:mt-0">
                {canSubmitForReview() && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button>
                        <Send className="mr-2 h-4 w-4" />
                        Submit for Review
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Submit Tender for Review</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will submit the tender for review by the Markets Service and State Controller.
                          Are you sure you want to proceed?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmitForReview}>Submit</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                
                {canApprove() && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="default">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Approve Tender</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will approve the tender and make it ready for publication.
                          Are you sure you want to proceed?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApprove}>Approve</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                
                {canReject() && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Tender</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will reject the tender and send it back to the department.
                          Are you sure you want to proceed?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReject}>Reject</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                
                {canPublish() && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="default">
                        <BellRing className="mr-2 h-4 w-4" />
                        Publish
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Publish Tender</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will publish the tender and make it publicly available.
                          Are you sure you want to proceed?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePublish}>Publish</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                
                {tender.status === 'published' && (
                  <Button>
                    <Handshake className="mr-2 h-4 w-4" />
                    Award Contract
                  </Button>
                )}
                
                <Button variant="outline">
                  <FileCheck className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>
          </div>

          {/* Tender Content Tabs */}
          <Tabs 
            defaultValue="details" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Tender Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2 text-lg">Description</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{tender.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start">
                        <Building className="h-5 w-5 mr-2 mt-0.5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Department</p>
                          <p>{getDepartmentName(tender.departmentId)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <User className="h-5 w-5 mr-2 mt-0.5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Created By</p>
                          <p>User ID: {tender.createdById}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 mr-2 mt-0.5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Publication Date</p>
                          <p>
                            {tender.publicationDate
                              ? format(new Date(tender.publicationDate), "MMMM d, yyyy")
                              : "Not set"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Timer className="h-5 w-5 mr-2 mt-0.5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Submission Deadline</p>
                          <p>
                            {tender.deadline
                              ? format(new Date(tender.deadline), "MMMM d, yyyy")
                              : "Not set"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <DollarSign className="h-5 w-5 mr-2 mt-0.5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Budget</p>
                          <p>{tender.budget || "Not specified"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Status Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Current Status</p>
                      <div className="mt-1">{getStatusBadge(tender.status)}</div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Created Date</p>
                      <p>{format(new Date(tender.createdAt), "MMMM d, yyyy")}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Updated</p>
                      <p>{format(new Date(tender.updatedAt), "MMMM d, yyyy")}</p>
                    </div>
                    
                    {tender.assignedToId && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Assigned To</p>
                        <p>User ID: {tender.assignedToId}</p>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div>
                      <CardTitle className="text-sm mb-2">Workflow Progress</CardTitle>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Draft</span>
                        <span>Published</span>
                        <span>Awarded</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent"
                          style={{
                            width: tender.status === 'draft' ? '10%' :
                                  tender.status === 'pending_review' ? '30%' :
                                  tender.status === 'review' ? '40%' :
                                  tender.status === 'approved' ? '50%' :
                                  tender.status === 'published' ? '70%' :
                                  tender.status === 'awarded' ? '100%' : '20%'
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tender Documents</CardTitle>
                  <CardDescription>
                    All documentation related to this tender
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tender.documents && tender.documents.length > 0 ? (
                    <div className="space-y-4">
                      {tender.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center">
                            <PaperclipIcon className="h-5 w-5 mr-2 text-gray-500" />
                            <span>{doc}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-accent">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <PaperclipIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No documents attached to this tender</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    <PaperclipIcon className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity History</CardTitle>
                  <CardDescription>
                    Track all changes and actions related to this tender
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingActivities ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    </div>
                  ) : activities && activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start p-3 border-b last:border-b-0">
                          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center mr-3">
                            <History className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm">
                              <span className="font-medium">User ID: {activity.userId}</span>{" "}
                              {activity.action}{" "}
                              {activity.details && (
                                <span className="text-gray-600">{activity.details}</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(new Date(activity.timestamp), "MMMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No activity recorded for this tender</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="comments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Comments & Discussion</CardTitle>
                  <CardDescription>
                    Team communication regarding this tender
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <Textarea
                      placeholder="Add a comment..."
                      className="mb-2"
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button 
                        disabled={!comment.trim() || updateTenderMutation.isPending}
                        onClick={() => {
                          if (comment.trim()) {
                            // Send just a comment without status change
                            updateTenderMutation.mutate({
                              status: tender.status, // Keep the same status
                              action: "commented"
                            });
                          }
                        }}
                      >
                        {updateTenderMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Post Comment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {activities?.filter(a => a.action === "added_comment").length ? (
                      activities.filter(a => a.action === "added_comment").map((comment) => (
                        <div key={comment.id} className="flex items-start p-3 border rounded-md">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mr-3">
                            <MessageSquare className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">User ID: {comment.userId}</p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(comment.timestamp), "MMMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                            <p className="text-sm mt-2">{comment.details}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No comments yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
