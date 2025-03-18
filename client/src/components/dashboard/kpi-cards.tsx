import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, FileText, Clock, BellRing, Handshake } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

export function KpiCards() {
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white">
            <CardContent className="p-6">
              <div className="h-24 animate-pulse bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return <div>Failed to load statistics</div>;
  }

  const kpiData = [
    {
      title: "Active Tenders",
      value: stats.activeTenders,
      change: 12,
      icon: <FileText className="text-accent" />,
      iconBg: "bg-blue-100",
      description: "from previous period",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      change: 3,
      direction: "up",
      icon: <Clock className="text-warning" />,
      iconBg: "bg-yellow-100",
      description: "requires attention",
    },
    {
      title: "Published Tenders",
      value: stats.publishedTenders,
      change: 8,
      icon: <BellRing className="text-purple-500" />,
      iconBg: "bg-purple-100",
      description: "currently in market",
    },
    {
      title: "Awarded Contracts",
      value: stats.awardedContracts,
      change: 15,
      icon: <Handshake className="text-success" />,
      iconBg: "bg-green-100",
      description: "total value: €2.4M",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {kpiData.map((kpi, index) => (
        <Card key={index} className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">{kpi.title}</h3>
              <span className={`w-8 h-8 rounded-full ${kpi.iconBg} flex items-center justify-center`}>
                {kpi.icon}
              </span>
            </div>
            <div className="flex items-end">
              <span className="text-3xl font-source font-bold text-primary">{kpi.value}</span>
              <span className={`ml-2 text-sm ${kpi.direction === "down" ? "text-error" : "text-success"} flex items-center`}>
                {kpi.direction === "down" ? (
                  <ArrowDown className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowUp className="mr-1 h-3 w-3" />
                )}
                {kpi.change}%
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">{kpi.description}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
