import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertTenderSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Étendre le schéma d'insertion avec des validations supplémentaires
const tenderFormSchema = z.object({
  reference: z.string().min(3, "La référence doit contenir au moins 3 caractères"),
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  status: z.string(),
  departmentId: z.number(),
  createdById: z.number(),
  assignedToId: z.number().optional().nullable(),
  budget: z.string().optional(),
  publicationDate: z.string().optional(),
  deadline: z.string().optional(),
  documents: z.array(z.string()).optional().nullable(),
});

type TenderFormValues = z.infer<typeof tenderFormSchema>;

export function TenderForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Get departments for selection
  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
  });

  // Define the form
  const form = useForm<TenderFormValues>({
    resolver: zodResolver(tenderFormSchema),
    defaultValues: {
      reference: "",
      title: "",
      description: "",
      status: "draft",
      departmentId: user?.departmentId || undefined,
      createdById: user?.id,
      budget: "",
      publicationDate: "",
      deadline: "",
      documents: [],
    },
  });

  // Mutation for creating a tender
  const createTenderMutation = useMutation({
    mutationFn: async (data: TenderFormValues) => {
      const response = await apiRequest("POST", "/api/tenders", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tender created",
        description: "Your tender has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      navigate("/tenders");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create tender",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: TenderFormValues) {
    // Ensure dates are properly formatted without timezone issues
    const formattedData = {
      ...data,
      // Add time to date string to ensure proper date handling
      publicationDate: data.publicationDate ? `${data.publicationDate}T12:00:00.000Z` : undefined,
      deadline: data.deadline ? `${data.deadline}T12:00:00.000Z` : undefined,
    };
    
    createTenderMutation.mutate(formattedData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., TN-2023-001" {...field} />
                </FormControl>
                <FormDescription>
                  A unique identifier for this tender
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Department responsible for this tender
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tender Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter the title of the tender" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide a detailed description of the tender"
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., €50,000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="publicationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Publication Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormDescription>
                  When will the tender be published
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Submission Deadline</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormDescription>
                  Final date for submissions
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/tenders")}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={createTenderMutation.isPending}
          >
            {createTenderMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Tender"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
