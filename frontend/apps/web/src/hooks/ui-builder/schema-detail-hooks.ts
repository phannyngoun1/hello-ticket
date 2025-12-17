/**
 * Custom hooks for Schema Detail Page
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUISchema,
  updateUISchema,
  publishUISchema,
  deleteUISchema,
  createUIPage,
  deleteUIPage,
  listUIPages,
  uiBuilderQueryKeys,
  UIPageCreate,
} from "@truths/api";
import { useToast } from "@truths/ui";

/**
 * Parse API error messages from backend
 */
export function parseErrorMessage(error: any): string {
  if (!error?.message) {
    return "An unexpected error occurred";
  }

  try {
    const parsed = JSON.parse(error.message);
    return parsed.message || parsed.error || error.message;
  } catch {
    return error.message;
  }
}

export function useSchema(schemaId: string) {
  return useQuery({
    queryKey: uiBuilderQueryKeys.schema(schemaId),
    queryFn: () => getUISchema(schemaId),
  });
}

export function useSchemaPages(schemaId: string) {
  return useQuery({
    queryKey: [...uiBuilderQueryKeys.pages(), schemaId, "by-schema"],
    queryFn: () => listUIPages(),
    enabled: !!schemaId,
  });
}

export function useSchemaMutations(schemaId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const publishMutation = useMutation({
    mutationFn: () => publishUISchema(schemaId),
    onSuccess: () => {
      toast({
        title: "Schema published successfully",
        description:
          "Your schema is now published. Click 'Create Page' to make it accessible at a route.",
      });
      queryClient.invalidateQueries({
        queryKey: uiBuilderQueryKeys.schema(schemaId),
      });
    },
    onError: (error: any) => {
      const errorMessage = parseErrorMessage(error);
      toast({
        title: "Unable to publish schema",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUISchema(schemaId),
    onSuccess: () => {
      toast({
        title: "Schema deleted",
        description: "The schema has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      const errorMessage = parseErrorMessage(error);
      toast({
        title: "Unable to delete schema",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (schema_data: any) =>
      updateUISchema(schemaId, { schema_data }),
    onSuccess: () => {
      toast({
        title: "Schema saved",
        description: "The schema has been successfully updated.",
      });
      queryClient.invalidateQueries({
        queryKey: uiBuilderQueryKeys.schema(schemaId),
      });
    },
    onError: (error: any) => {
      const errorMessage = parseErrorMessage(error);
      toast({
        title: "Unable to save schema",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return {
    publishMutation,
    deleteMutation,
    updateMutation,
  };
}

export function usePageMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPageMutation = useMutation({
    mutationFn: (data: UIPageCreate) => createUIPage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: uiBuilderQueryKeys.pages(),
      });
    },
    onError: (error: any) => {
      const errorMessage = parseErrorMessage(error);
      toast({
        title: "Unable to create page",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: (pageId: string) => deleteUIPage(pageId),
    onSuccess: () => {
      toast({
        title: "Page deleted",
        description: "The page has been successfully deleted.",
      });
      queryClient.invalidateQueries({
        queryKey: uiBuilderQueryKeys.pages(),
      });
    },
    onError: (error: any) => {
      const errorMessage = parseErrorMessage(error);
      toast({
        title: "Unable to delete page",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return {
    createPageMutation,
    deletePageMutation,
  };
}

