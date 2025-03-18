import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Analytics() {
  const { user } = useAuth();
  
  // Fetch tender statistics
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/stats"],
  });

  // Fetch all departments for filtering
  const { data: departments } = useQuery<any>({
    queryKey: ["/api/departments"],
  });

  // Generate colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Format data for status distribution
  const getStatusData = () => {
    if (!stats) return [];
    
    return Object.entries(stats.tendersByStatus || {}).map(([status, count]: [string, any]) => ({
      name: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
    }));
  };

  // Format data for department distribution
  const getDepartmentData = () => {
    if (!stats || !departments) return [];
    
    return stats.tendersByDepartment?.map((dept: any) => ({
      name: departments.find((d: any) => d.id === dept.departmentId)?.name || `Département ${dept.departmentId}`,
      tenders: dept.tenderCount,
    })) || [];
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
  
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Analyses et Statistiques</h1>
      
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="department">Par Département</TabsTrigger>
          <TabsTrigger value="status">Par Statut</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Appels d'offres par statut</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getStatusData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getStatusData().map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} appel(s) d'offres`, '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Appels d'offres par département</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getDepartmentData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value) => [`${value} appel(s) d'offres`, '']} />
                    <Bar dataKey="tenders" fill="#3498db" name="Nombre d'appels d'offres" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="department">
          <Card>
            <CardHeader>
              <CardTitle>Distribution des appels d'offres par département</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getDepartmentData()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value} appel(s) d'offres`, '']} />
                  <Legend />
                  <Bar dataKey="tenders" fill="#3498db" name="Nombre d'appels d'offres" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Distribution des appels d'offres par statut</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getStatusData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getStatusData().map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} appel(s) d'offres`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Statistiques générales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-primary/10 p-4 rounded-lg text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stats?.activeTenders || 0}</div>
                <div className="text-sm text-muted-foreground">Appels d'offres actifs</div>
              </div>
              <div className="bg-yellow-500/10 p-4 rounded-lg text-center">
                <div className="text-4xl font-bold text-yellow-500 mb-2">{stats?.pendingApprovals || 0}</div>
                <div className="text-sm text-muted-foreground">En attente d'approbation</div>
              </div>
              <div className="bg-green-500/10 p-4 rounded-lg text-center">
                <div className="text-4xl font-bold text-green-500 mb-2">{stats?.publishedTenders || 0}</div>
                <div className="text-sm text-muted-foreground">Publiés</div>
              </div>
              <div className="bg-blue-500/10 p-4 rounded-lg text-center">
                <div className="text-4xl font-bold text-blue-500 mb-2">{stats?.awardedContracts || 0}</div>
                <div className="text-sm text-muted-foreground">Contrats attribués</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}