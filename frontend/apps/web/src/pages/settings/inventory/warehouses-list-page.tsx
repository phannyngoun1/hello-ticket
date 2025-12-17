import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
} from "@truths/ui";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { api } from "@truths/api";
import { toast } from "@truths/ui";

interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  items: Warehouse[];
  skip: number;
  limit: number;
  has_next: boolean;
}

export function WarehousesListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch warehouses
  const { data, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: ["warehouses"],
    queryFn: async () => {
      return api.get<PaginatedResponse>(
        `/api/v1/inventory/warehouses/?skip=0&limit=100`,
        { requiresAuth: true }
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/v1/inventory/warehouses/${id}`, {
        requiresAuth: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({
        title: t("common.success"),
        description: t("pages.settings.inventory.warehouses.deleted"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("common.errorOccurred"),
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string, code: string) => {
    if (window.confirm(t("pages.settings.inventory.warehouses.confirmDelete", { code }))) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b">
        <div>
          <h2 className="text-lg font-semibold">
            {t("pages.settings.inventory.warehouses.title", "Warehouses")}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t("common.search", "Search...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs w-48"
            />
          </div>
          <Button size="sm" className="h-8 text-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t("common.add", "Add")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              {t("pages.settings.inventory.warehouses.list", "Warehouse List")}
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {data?.items.length || 0} {t("common.items", "items")}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="text-center py-6 text-xs text-muted-foreground">
              {t("common.loading", "Loading...")}
            </div>
          )}
          {error && (
            <div className="text-center py-6 text-xs text-destructive">
              {t("common.errorOccurred", "An error occurred")}
            </div>
          )}
          {!isLoading && !error && (
            <div className="border-t">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="h-8 px-3 text-left align-middle font-medium text-xs">{t("pages.settings.inventory.warehouses.code", "Code")}</th>
                    <th className="h-8 px-3 text-left align-middle font-medium text-xs">{t("pages.settings.inventory.warehouses.name", "Name")}</th>
                    <th className="h-8 px-3 text-left align-middle font-medium text-xs">{t("pages.settings.inventory.warehouses.address", "Address")}</th>
                    <th className="h-8 px-3 text-right align-middle font-medium text-xs">{t("common.actions", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                        {t("common.noItems", "No items found")}
                      </td>
                    </tr>
                  ) : (
                    data?.items.map((warehouse) => (
                      <tr key={warehouse.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2 text-xs font-medium">{warehouse.code}</td>
                        <td className="px-3 py-2 text-xs">{warehouse.name}</td>
                        <td className="px-3 py-2 text-xs">
                          {warehouse.address?.street || t("common.none", "None")}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleDelete(warehouse.id, warehouse.code)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

