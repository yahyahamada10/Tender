
import { apiRequest } from "./queryClient";

/**
 * Service pour interagir avec une API externe de contrats
 */
export const contractExternalService = {
  /**
   * Crée un contrat via l'API externe
   */
  async createExternalContract(contractData: any) {
    try {
      // Remplacez cette URL par l'URL réelle de votre API externe
      const externalApiUrl = "https://votre-api-externe.com/ajoutercontrat";
      
      const response = await fetch(externalApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contractData),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Erreur lors de l'appel à l'API externe:", error);
      throw error;
    }
  },
  
  /**
   * Crée un contrat en utilisant à la fois l'API externe et l'API locale
   */
  async createContractWithExternalSync(contractData: any) {
    // Appel à l'API externe
    const externalResponse = await this.createExternalContract(contractData);
    
    // Puis création du contrat dans notre système local
    const localResponse = await apiRequest("POST", "/api/contracts", {
      ...contractData,
      externalId: externalResponse.id, // Stockez l'ID externe si nécessaire
    });
    
    return {
      local: await localResponse.json(),
      external: externalResponse,
    };
  }
};
