import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  cn,
} from "@truths/ui";
import { Plus, MapPin } from "lucide-react";
import { AddressManagement } from "@truths/custom-ui";
import { CompanyAddressService } from "@truths/shared";
import { CompanyAddressServiceAdapter } from "../../services/company-addresses";
import { api } from "@truths/api";
import { useState } from "react";
import { useDensityStyles } from "@truths/utils";

type CompanyAddressType = "default" | "billing" | "shipping";

export function CompanyAddressesPage() {
  const { t } = useTranslation();
  const density = useDensityStyles();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Initialize company address service
  const companyAddressService = useMemo(
    () =>
      new CompanyAddressService({
        apiClient: api,
        endpoints: {
          "company-addresses": "/api/v1/company-addresses",
        },
      }),
    []
  );

  // Create service adapter
  const serviceAdapter = useMemo(
    () => new CompanyAddressServiceAdapter(companyAddressService),
    [companyAddressService]
  );

  // Configuration for address management
  // Company can have: one default address, multiple billing addresses, multiple shipping addresses
  const config = useMemo(
    () => ({
      addressTypes: ["default", "billing", "shipping"] as const,
      addressTypeLabels: {
        default: t("pages.settings.companyAddresses.default", "Default"),
        billing: t("pages.settings.companyAddresses.billing", "Billing"),
        shipping: t("pages.settings.companyAddresses.shipping", "Shipping"),
      },
      defaultAddressType: "default" as CompanyAddressType,
      entityLabel: "company",
      formatAddressTypeLabel: (type: CompanyAddressType): string => {
        const labels: Record<CompanyAddressType, string> = {
          default: t("pages.settings.companyAddresses.default", "Default"),
          billing: t("pages.settings.companyAddresses.billing", "Billing"),
          shipping: t("pages.settings.companyAddresses.shipping", "Shipping"),
        };
        return labels[type];
      },
    }),
    [t]
  );

  return (
    <div className={cn("space-y-6", density.spacingFormSection)}>
      <Card>
        <CardHeader className={density.spacingFormItem}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={cn("flex items-center gap-2", density.textSizeCardTitle, "font-semibold")}>
                <MapPin className={cn("h-5 w-5", density.iconSize)} />
                {t(
                  "pages.settings.companyAddresses.title",
                  "Company Addresses"
                )}
              </CardTitle>
              <CardDescription className={density.textSizeCardDescription}>
                {t(
                  "pages.settings.companyAddresses.description",
                  "Manage your company addresses. You can have one default address, multiple billing addresses, and multiple shipping addresses."
                )}
              </CardDescription>
            </div>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("pages.settings.companyAddresses.addAddress", "Add Address")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className={cn(density.paddingContainer)}>
          <AddressManagement
            entityId="company" // Not used for company addresses (tenant-scoped)
            service={serviceAdapter}
            config={config}
            addDialogOpen={addDialogOpen}
            onAddDialogOpenChange={setAddDialogOpen}
          />
        </CardContent>
      </Card>
    </div>
  );
}
