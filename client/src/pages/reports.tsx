import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, FileText, BarChart, PieChart } from "lucide-react";

export default function Reports() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("tenders");
  const [dateRange, setDateRange] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [format, setFormat] = useState("pdf");
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch departments for filtering
  const { data: departments } = useQuery<any>({
    queryKey: ["/api/departments"],
  });

  // Simulate generating a report
  const generateReport = () => {
    setIsGenerating(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Rapport généré avec succès",
        description: "Le rapport a été généré et est prêt à être téléchargé.",
      });
    }, 2000);
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Rapports</h1>
      
      <Tabs defaultValue="generate" className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="generate">Générer un rapport</TabsTrigger>
          <TabsTrigger value="saved">Rapports sauvegardés</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Générer un nouveau rapport</CardTitle>
              <CardDescription>
                Configurez les paramètres pour générer un rapport détaillé
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="report-type">Type de rapport</Label>
                  <Select defaultValue={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenders">Appels d'offres</SelectItem>
                      <SelectItem value="contracts">Contrats</SelectItem>
                      <SelectItem value="service-orders">Ordres de service</SelectItem>
                      <SelectItem value="activity">Activité utilisateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="format">Format de sortie</Label>
                  <Select defaultValue={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date-range">Période prédéfinie</Label>
                  <Select defaultValue={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Aujourd'hui</SelectItem>
                      <SelectItem value="week">Cette semaine</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                      <SelectItem value="quarter">Ce trimestre</SelectItem>
                      <SelectItem value="year">Cette année</SelectItem>
                      <SelectItem value="custom">Personnalisée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {dateRange === "custom" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start-date">Date de début</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-date">Date de fin</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {reportType === "tenders" && (
                <div className="space-y-2">
                  <Label htmlFor="department">Département</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les départements" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les départements</SelectItem>
                      {departments?.map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="include-charts">Options supplémentaires</Label>
                <div className="flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span>Inclure des graphiques</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span>Inclure des tableaux détaillés</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span>Sauvegarder pour accès futur</span>
                  </label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={generateReport} 
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Générer le rapport
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="saved">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                id: 1,
                title: "Appels d'offres - Janvier 2025",
                date: "01/02/2025",
                type: "tenders",
                format: "pdf",
                icon: FileText
              },
              {
                id: 2,
                title: "Statistiques des contrats - Q4 2024",
                date: "15/01/2025",
                type: "contracts",
                format: "excel",
                icon: BarChart
              },
              {
                id: 3,
                title: "Activité utilisateurs - Décembre 2024",
                date: "05/01/2025",
                type: "activity",
                format: "pdf",
                icon: PieChart
              }
            ].map(report => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <report.icon className="h-5 w-5 mr-2" />
                    {report.title}
                  </CardTitle>
                  <CardDescription>
                    Généré le {report.date}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <div><strong>Type:</strong> {report.type === "tenders" ? "Appels d'offres" : 
                                              report.type === "contracts" ? "Contrats" : 
                                              "Activité utilisateur"}</div>
                    <div><strong>Format:</strong> {report.format.toUpperCase()}</div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}