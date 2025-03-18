import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Activity, Activity as ActivityType } from "@shared/schema";
import { 
  FileSignature, BellRing, Handshake, AlertTriangle, XCircle, MessageSquare,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function RecentActivity() {
  const { data: activities, isLoading } = useQuery<ActivityType[]>({
    queryKey: ["/api/activities"],
  });

  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "approved":
        return <FileSignature className="text-white" />;
      case "published":
        return <BellRing className="text-white" />;
      case "awarded":
        return <Handshake className="text-white" />;
      case "flagged":
        return <AlertTriangle className="text-white" />;
      case "rejected":
        return <XCircle className="text-white" />;
      case "added_comment":
        return <MessageSquare className="text-white" />;
      default:
        return <FileSignature className="text-white" />;
    }
  };

  const getActivityIconBg = (action: string) => {
    switch (action) {
      case "approved":
        return "bg-accent";
      case "published":
        return "bg-purple-500";
      case "awarded":
        return "bg-success";
      case "flagged":
        return "bg-warning";
      case "rejected":
        return "bg-error";
      case "added_comment":
        return "bg-secondary";
      default:
        return "bg-accent";
    }
  };

  // Sample activities if real data is not available
  const sampleActivities = [
    {
      id: 1,
      action: "approved",
      details: "Sophie Martin approved tender for Office Supplies Procurement",
      timestamp: new Date(new Date().getTime() - 1000 * 60 * 60), // 1 hour ago
    },
    {
      id: 2,
      action: "published",
      details: "Thomas Durand published tender for IT Network Equipment",
      timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 24), // 1 day ago
    },
    {
      id: 3,
      action: "awarded",
      details: "Emma Weber awarded contract to TechSolutions Inc.",
      timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    },
    {
      id: 4,
      action: "flagged",
      details: "System flagged deadline approach for Security Services Tender",
      timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
    },
    {
      id: 5,
      action: "rejected",
      details: "Jean Dupont rejected tender for Cafeteria Management",
      timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    },
    {
      id: 6,
      action: "added_comment",
      details: "Marie Leclerc added comment to Building Renovation Tender",
      timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 6), // 6 days ago
    },
  ];

  const displayActivities = activities?.length 
    ? activities.slice(0, 6).map(activity => ({
        id: activity.id,
        action: activity.action,
        details: activity.details || "",
        timestamp: new Date(activity.timestamp),
      }))
    : sampleActivities;

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-source font-semibold text-primary">Recent Activity</CardTitle>
        <button className="text-sm text-accent hover:underline">View All</button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {displayActivities.map((activity) => (
            <div key={activity.id} className="flex">
              <div className="flex-shrink-0 mr-3">
                <div className={`w-9 h-9 rounded-full ${getActivityIconBg(activity.action)} flex items-center justify-center`}>
                  {getActivityIcon(activity.action)}
                </div>
              </div>
              <div>
                <p className="text-sm">
                  {activity.details}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
