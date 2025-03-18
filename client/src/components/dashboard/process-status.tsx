import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FileText, CheckCircle, BellRing, Handshake, CheckSquare, Flag } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StatsData {
  activeTenders: number;
  pendingApprovals: number;
  publishedTenders: number;
  awardedContracts: number;
  tendersByStatus: Record<string, number>;
  tendersByDepartment: Array<{
    departmentId: number;
    departmentName: string;
    tenderCount: number;
    tendersByStatus: Record<string, number>;
  }>;
}

export function ProcessStatus() {
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Tender Process Status</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Tender Process Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Failed to load process data</p>
        </CardContent>
      </Card>
    );
  }

  // Process steps for visualization
  const processSteps = [
    {
      name: "Draft",
      value: stats.tendersByStatus.draft || 0,
      icon: <FileText className="text-white" />,
      completed: true,
    },
    {
      name: "Review",
      value: (stats.tendersByStatus.pending_review || 0) + (stats.tendersByStatus.review || 0),
      icon: <CheckCircle className="text-white" />,
      completed: true,
    },
    {
      name: "Published",
      value: stats.tendersByStatus.published || 0,
      icon: <BellRing className="text-white" />,
      completed: false,
      active: true,
    },
    {
      name: "Awarded",
      value: stats.tendersByStatus.awarded || 0,
      icon: <Handshake className="text-white" />,
      completed: false,
    },
    {
      name: "In Progress",
      value: 37, // This would come from contracts in progress
      icon: <CheckSquare className="text-white" />,
      completed: false,
    },
    {
      name: "Completed",
      value: 22, // This would come from completed contracts
      icon: <Flag className="text-white" />,
      completed: false,
    },
  ];

  return (
    <Card className="bg-white lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-source font-semibold text-primary">Tender Process Status</CardTitle>
        <button className="text-sm text-accent hover:underline">View All</button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-flex min-w-full mb-4">
            {processSteps.map((step, index) => (
              <div 
                key={index} 
                className={`relative flex flex-col items-center flex-1 ${
                  index < processSteps.length - 1 
                    ? (step.completed ? "before:border-accent" : "before:border-gray-300")
                    : ""
                }`}
                style={{
                  paddingBottom: "1rem",
                  marginBottom: "0.5rem",
                }}
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center relative z-10 ${
                    step.completed 
                      ? "bg-success" 
                      : step.active 
                        ? "bg-accent" 
                        : "bg-gray-300"
                  }`}
                >
                  {step.icon}
                </div>
                <div className="step-name text-xs font-medium mt-2">{step.name}</div>
                <div className="text-xl font-bold mt-1">{step.value}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="font-medium mb-3">Tender Process by Department</h3>
          <div className="space-y-3">
            {stats.tendersByDepartment.map((dept) => (
              <div key={dept.departmentId} className="relative pt-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium">{dept.departmentName}</div>
                  <div className="text-sm text-gray-500">{dept.tenderCount} tenders</div>
                </div>
                
                <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-200">
                  {dept.tendersByStatus.draft > 0 && (
                    <Progress
                      value={(dept.tendersByStatus.draft / dept.tenderCount) * 100}
                      className="rounded-none h-full bg-accent"
                    />
                  )}
                  {dept.tendersByStatus.published > 0 && (
                    <Progress
                      value={(dept.tendersByStatus.published / dept.tenderCount) * 100}
                      className="rounded-none h-full bg-purple-500"
                    />
                  )}
                  {dept.tendersByStatus.awarded > 0 && (
                    <Progress
                      value={(dept.tendersByStatus.awarded / dept.tenderCount) * 100}
                      className="rounded-none h-full bg-success"
                    />
                  )}
                  {dept.tendersByStatus.review > 0 && (
                    <Progress
                      value={(dept.tendersByStatus.review / dept.tenderCount) * 100}
                      className="rounded-none h-full bg-warning"
                    />
                  )}
                </div>
                
                <div className="flex flex-wrap text-xs text-gray-500 mt-1 gap-3">
                  {dept.tendersByStatus.draft > 0 && (
                    <span className="flex items-center">
                      <span className="w-2 h-2 inline-block mr-1 bg-accent rounded-full"></span> 
                      Draft ({dept.tendersByStatus.draft})
                    </span>
                  )}
                  {dept.tendersByStatus.published > 0 && (
                    <span className="flex items-center">
                      <span className="w-2 h-2 inline-block mr-1 bg-purple-500 rounded-full"></span> 
                      Published ({dept.tendersByStatus.published})
                    </span>
                  )}
                  {dept.tendersByStatus.awarded > 0 && (
                    <span className="flex items-center">
                      <span className="w-2 h-2 inline-block mr-1 bg-success rounded-full"></span> 
                      Awarded ({dept.tendersByStatus.awarded})
                    </span>
                  )}
                  {dept.tendersByStatus.review > 0 && (
                    <span className="flex items-center">
                      <span className="w-2 h-2 inline-block mr-1 bg-warning rounded-full"></span> 
                      Review ({dept.tendersByStatus.review})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
