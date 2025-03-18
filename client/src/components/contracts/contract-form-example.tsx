
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { contractExternalService } from "@/lib/api-services";
import { Loader2 } from "lucide-react";

export function ContractExternalForm() {
  const [contractData, setContractData] = useState({
    title: "",
    supplierName: "",
    amount: "",
    tenderId: 0,
    // autres champs nécessaires
  });
  
  const { toast } = useToast();
  
  const createContractMutation = useMutation({
    mutationFn: (data: any) => contractExternalService.createContractWithExternalSync(data),
    onSuccess: () => {
      toast({
        title: "Contrat créé",
        description: "Le contrat a été créé avec succès dans les deux systèmes.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la création du contrat: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createContractMutation.mutate(contractData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Vos champs de formulaire ici */}
      
      <Button type="submit" disabled={createContractMutation.isPending}>
        {createContractMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Création en cours...
          </>
        ) : (
          "Créer contrat avec synchronisation externe"
        )}
      </Button>
    </form>
  );
}
