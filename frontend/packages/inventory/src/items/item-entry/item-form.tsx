/**
 * Item Form Component
 *
 * Comprehensive form for creating/editing items with organized sections
 *
 * @author Phanny
 */

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { forwardRef, useRef, useEffect } from "react";
import {
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Separator,
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@truths/ui";
import { Package, Settings, Info, Ruler } from "lucide-react";
import {
  ItemType,
  ItemUsage,
  TrackingScope,
  TrackingType,
  UoMContext,
  type ItemUoMMapping,
  type CreateItemUoMMappingInput,
} from "../../types";
import type { ItemCategoryTree } from "../../types";
import { CategoryTreeSelect } from "./category-tree-select";
import { Button } from "@truths/ui";
import { Plus, Trash2 } from "lucide-react";

// Form schema
const itemFormSchema = z
  .object({
    // Basic Info
    code: z.string().max(100).min(1, "Code is required"),
    sku: z.string().max(100).nullish(),
    name: z.string().min(1, "Name is required").max(200),
    description: z.string().max(1000).nullish(),

    // Classification
    item_type: z.string(),
    item_usage: z.string(),
    category_id: z.string().nullish(),

    // Tracking
    tracking_scope: z.string(),
    tracking_requirements: z.array(z.string()),

    // UoM
    default_uom: z.string().min(1, "Default UoM is required").max(20),
    uom_mappings: z
      .array(
        z.object({
          context: z.string().min(1, "Context is required"),
          uom_code: z.string().min(1, "UoM code is required"),
          conversion_factor: z
            .number()
            .positive("Conversion factor must be positive"),
          is_primary: z.boolean().optional(),
        })
      )
      .optional(),

    // Attributes
    perishable: z.boolean(),
  })
  .refine(
    (data) => {
      // If tracking_scope is 'none', tracking_requirements should be empty
      if (
        data.tracking_scope === "none" &&
        data.tracking_requirements.length > 0
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Cannot have tracking requirements when tracking scope is 'none'",
      path: ["tracking_requirements"],
    }
  );

export type ItemFormData = z.infer<typeof itemFormSchema>;

interface ItemFormProps {
  defaultValues?: Partial<ItemFormData>;
  onSubmit: (data: ItemFormData) => Promise<void> | void;
  isLoading?: boolean;
  mode?: "create" | "edit";
  categoryTree?: ItemCategoryTree[];
  isCategoryTreeLoading?: boolean;
  categoryTreeError?: Error | null;
  onReloadCategoryTree?: () => void;
  uomOptions?: Array<{ code: string; name: string }>;
}

export const ItemForm = forwardRef<HTMLFormElement, ItemFormProps>(
  function ItemForm(
    {
      defaultValues,
      onSubmit,
      // isLoading = false,
      // mode = "create",
      categoryTree = [],
      isCategoryTreeLoading,
      categoryTreeError,
      onReloadCategoryTree,
      uomOptions = [
        { code: "EA", name: "Each" },
        { code: "PCS", name: "Pieces" },
        { code: "BOX", name: "Box" },
        { code: "PLT", name: "Pallet" },
        { code: "KG", name: "Kilogram" },
        { code: "L", name: "Liter" },
      ],
    },
    ref
  ) {
    const {
      register,
      handleSubmit,
      control,
      watch,
      formState: { errors, isSubmitted },
    } = useForm<ItemFormData>({
      resolver: zodResolver(itemFormSchema),
      defaultValues: {
        item_type: "product",
        item_usage: "for_sale",
        tracking_scope: "both",
        tracking_requirements: [],
        default_uom: "EA",
        uom_mappings: [],
        perishable: false,
        ...defaultValues,
      },
    });

    const trackingScope = watch("tracking_scope");
    const itemType = watch("item_type");
    const itemUsage = watch("item_usage");
    const defaultUom = watch("default_uom");
    const uomMappings = watch("uom_mappings") || [];
    const firstErrorRef = useRef<HTMLDivElement | null>(null);

    // Scroll to first error when validation fails
    useEffect(() => {
      if (isSubmitted && Object.keys(errors).length > 0) {
        // Find the first error field and scroll to it
        const firstErrorField = Object.keys(errors)[0];
        const errorElement = document.querySelector(
          `[name="${firstErrorField}"], #${firstErrorField}`
        ) as HTMLElement;
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
          errorElement.focus();
        } else if (firstErrorRef.current) {
          firstErrorRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    }, [errors, isSubmitted]);

    const onFormSubmit = async (data: ItemFormData) => {
      await onSubmit(data);
    };

    const onFormInvalid = (validationErrors: any) => {
      console.error("Form validation errors:", validationErrors);
      // React Hook Form will automatically set the errors in formState.errors
      // The useEffect above will handle scrolling to the first error
    };

    return (
      <form
        ref={ref}
        id="item-form"
        onSubmit={handleSubmit(onFormSubmit, onFormInvalid)}
        className="space-y-6"
      >
        {/* Basic Information Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Basic Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field data-invalid={!!errors.code}>
              <FieldLabel htmlFor="code">
                Code<span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="code"
                placeholder="ITEM-0001"
                {...register("code")}
                className={errors.code ? "border-destructive" : ""}
              />
              <FieldError>{errors.code?.message}</FieldError>
            </Field>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">
                Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="name"
                placeholder="Item Name"
                {...register("name")}
                className={errors.name ? "border-destructive" : ""}
              />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.sku}>
              <FieldLabel htmlFor="sku">
                SKU <span className="text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Input
                id="sku"
                placeholder="SKU-001"
                {...register("sku")}
                className={errors.sku ? "border-destructive" : ""}
              />
              <FieldError>{errors.sku?.message}</FieldError>
            </Field>
          </div>

          <Field data-invalid={!!errors.description}>
            <FieldLabel htmlFor="description">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea
              id="description"
              placeholder="Item description..."
              rows={3}
              {...register("description")}
              className={errors.description ? "border-destructive" : ""}
            />
            <FieldError>{errors.description?.message}</FieldError>
          </Field>
        </section>

        <Separator />

        {/* Classification Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Classification</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="item_type">
                Item Type <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                name="item_type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="item_type">
                      <SelectValue placeholder="Select item type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ItemType.PRODUCT}>Product</SelectItem>
                      <SelectItem value={ItemType.SERVICE}>Service</SelectItem>
                      <SelectItem value={ItemType.RAW_MATERIAL}>
                        Raw Material
                      </SelectItem>
                      <SelectItem value={ItemType.WIP}>
                        Work in Progress
                      </SelectItem>
                      <SelectItem value={ItemType.MANUFACTURING_STAGING}>
                        Manufacturing Staging
                      </SelectItem>
                      <SelectItem value={ItemType.COMPONENT}>
                        Component
                      </SelectItem>
                      <SelectItem value={ItemType.PACKAGING}>
                        Packaging
                      </SelectItem>
                      <SelectItem value={ItemType.TOOL}>Tool</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldDescription>
                What the item is (product, service, raw material, etc.)
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="item_usage">
                Item Usage <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                name="item_usage"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="item_usage">
                      <SelectValue placeholder="Select usage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ItemUsage.FOR_SALE}>
                        For Sale
                      </SelectItem>
                      <SelectItem value={ItemUsage.INTERNAL_USE}>
                        Internal Use
                      </SelectItem>
                      <SelectItem value={ItemUsage.MANUFACTURED}>
                        Manufactured
                      </SelectItem>
                      <SelectItem value={ItemUsage.SAMPLE}>Sample</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldDescription>
                Who uses the item (for sale, internal use, or both)
              </FieldDescription>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="category_id">
              Category <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <CategoryTreeSelect
                  value={field.value || undefined}
                  onChange={field.onChange}
                  categories={categoryTree}
                  isLoading={isCategoryTreeLoading}
                  error={categoryTreeError ?? undefined}
                  onRetry={onReloadCategoryTree}
                  placeholder="Select category"
                  emptyMessage="No categories available"
                />
              )}
            />
            {categoryTreeError && (
              <FieldDescription className="text-destructive">
                Unable to load categories. Please try again.
              </FieldDescription>
            )}
          </Field>
        </section>

        <Separator />

        {/* Tracking Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Tracking Configuration</h3>
          </div>
          <Field>
            <FieldLabel htmlFor="tracking_scope">
              Tracking Scope <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="tracking_scope"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="tracking_scope">
                    <SelectValue placeholder="Select tracking scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TrackingScope.NONE}>None</SelectItem>
                    <SelectItem value={TrackingScope.INVENTORY_ONLY}>
                      Inventory Only
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldDescription>
              Where this item should be tracked
            </FieldDescription>
          </Field>

          {trackingScope !== TrackingScope.NONE && (
            <Field data-invalid={!!errors.tracking_requirements}>
              <FieldLabel>Tracking Requirements</FieldLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { value: TrackingType.SERIAL, label: "Serial" },
                  { value: TrackingType.EXPIRATION, label: "Expiration" },
                  {
                    value: TrackingType.MANUFACTURING_DATE,
                    label: "Manufacturing Date",
                  },
                  {
                    value: TrackingType.SUPPLIER_BATCH,
                    label: "Supplier Batch",
                  },
                ].map((option) => {
                  const checkboxId = `tracking-${option.value}`;
                  return (
                    <label
                      key={option.value}
                      htmlFor={checkboxId}
                      className="flex gap-2 items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <Controller
                        name="tracking_requirements"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id={checkboxId}
                            checked={field.value?.includes(option.value)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, option.value]);
                              } else {
                                field.onChange(
                                  current.filter((v) => v !== option.value)
                                );
                              }
                            }}
                            className="cursor-pointer"
                          />
                        )}
                      />
                      <Label
                        htmlFor={checkboxId}
                        className="text-sm font-normal cursor-pointer select-none"
                      >
                        {option.label}
                      </Label>
                    </label>
                  );
                })}
              </div>
              <FieldError>{errors.tracking_requirements?.message}</FieldError>
            </Field>
          )}
        </section>

        <Separator />

        {/* Units & Attributes Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Units & Attributes</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field data-invalid={!!errors.default_uom}>
              <FieldLabel htmlFor="default_uom">
                Default UoM <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                name="default_uom"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="default_uom">
                      <SelectValue placeholder="Select UoM" />
                    </SelectTrigger>
                    <SelectContent>
                      {uomOptions.map((uom) => (
                        <SelectItem key={uom.code} value={uom.code}>
                          {uom.code} - {uom.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.default_uom?.message}</FieldError>
            </Field>

            <Field>
              <div className="flex items-center gap-2 space-x-3 pt-8">
                <Controller
                  name="perishable"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="perishable"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <FieldLabel
                  htmlFor="perishable"
                  className="text-sm font-normal cursor-pointer"
                >
                  Perishable Item
                </FieldLabel>
              </div>
            </Field>
          </div>
        </section>

        <Separator />

        {/* UoM Mappings Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">
                Unit of Measure Mappings
              </h3>
            </div>
            <Controller
              name="uom_mappings"
              control={control}
              render={({ field }) => {
                const current = field.value || [];
                // Find available contexts that aren't already used
                const usedContexts = new Set(current.map((m) => m.context));
                const availableContexts = [
                  UoMContext.PURCHASE,
                  UoMContext.SALE,
                  UoMContext.PRODUCTION,
                  UoMContext.TRANSFER,
                  UoMContext.TRANSPORT,
                  UoMContext.STORAGE,
                ].filter((ctx) => !usedContexts.has(ctx));

                return (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={availableContexts.length === 0}
                    onClick={() => {
                      if (availableContexts.length > 0) {
                        field.onChange([
                          ...current,
                          {
                            context: availableContexts[0],
                            uom_code: defaultUom || "",
                            conversion_factor: 1.0,
                            is_primary: false,
                          },
                        ]);
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add UoM Mapping
                  </Button>
                );
              }}
            />
          </div>
          <FieldDescription>
            Define different units of measure for different contexts (purchase,
            sale, production, transfer, etc.)
          </FieldDescription>

          <Controller
            name="uom_mappings"
            control={control}
            render={({ field }) => {
              const mappings = field.value || [];
              if (mappings.length === 0) {
                return (
                  <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
                    No UoM mappings added. Click "Add UoM Mapping" to add one.
                  </div>
                );
              }
              return (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Context
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          UoM Code
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Conversion Factor
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium w-[80px]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {mappings.map((mapping, index) => (
                        <tr key={index} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <Field>
                              <Controller
                                name={`uom_mappings.${index}.context`}
                                control={control}
                                render={({ field: contextField }) => (
                                  <Select
                                    value={contextField.value}
                                    onValueChange={contextField.onChange}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Select context" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value={UoMContext.PURCHASE}>
                                        Purchase
                                      </SelectItem>
                                      <SelectItem value={UoMContext.SALE}>
                                        Sale
                                      </SelectItem>
                                      <SelectItem value={UoMContext.PRODUCTION}>
                                        Production
                                      </SelectItem>
                                      <SelectItem value={UoMContext.TRANSFER}>
                                        Transfer
                                      </SelectItem>
                                      <SelectItem value={UoMContext.TRANSPORT}>
                                        Transport
                                      </SelectItem>
                                      <SelectItem value={UoMContext.STORAGE}>
                                        Storage
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              {errors.uom_mappings?.[index]?.context && (
                                <FieldError className="text-xs mt-1">
                                  {errors.uom_mappings[index]?.context?.message}
                                </FieldError>
                              )}
                            </Field>
                          </td>
                          <td className="px-4 py-3">
                            <Field>
                              <Controller
                                name={`uom_mappings.${index}.uom_code`}
                                control={control}
                                render={({ field: uomField }) => (
                                  <Select
                                    value={uomField.value || undefined}
                                    onValueChange={uomField.onChange}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Select UoM" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {uomOptions.map((uom) => (
                                        <SelectItem
                                          key={uom.code}
                                          value={uom.code}
                                        >
                                          {uom.code} - {uom.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              {errors.uom_mappings?.[index]?.uom_code && (
                                <FieldError className="text-xs mt-1">
                                  {
                                    errors.uom_mappings[index]?.uom_code
                                      ?.message
                                  }
                                </FieldError>
                              )}
                            </Field>
                          </td>
                          <td className="px-4 py-3">
                            <Field>
                              <Controller
                                name={`uom_mappings.${index}.conversion_factor`}
                                control={control}
                                render={({ field: factorField }) => (
                                  <Input
                                    type="number"
                                    step="0.0001"
                                    min="0.0001"
                                    placeholder="1.0"
                                    value={factorField.value || ""}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value);
                                      factorField.onChange(
                                        isNaN(value) ? 0 : value
                                      );
                                    }}
                                    className="h-9"
                                  />
                                )}
                              />
                              {errors.uom_mappings?.[index]
                                ?.conversion_factor && (
                                <FieldError className="text-xs mt-1">
                                  {
                                    errors.uom_mappings[index]
                                      ?.conversion_factor?.message
                                  }
                                </FieldError>
                              )}
                            </Field>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0"
                              onClick={() => {
                                const updated = mappings.filter(
                                  (_, i) => i !== index
                                );
                                field.onChange(updated);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }}
          />
        </section>

        {/* Business Rules Validation Messages */}
        {itemType === ItemType.SERVICE &&
          itemUsage === ItemUsage.INTERNAL_USE && (
            <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Services are typically for sale. Consider using "for_sale" or
                "both" for services.
              </p>
            </div>
          )}

        {itemType === ItemType.WIP && itemUsage === ItemUsage.FOR_SALE && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
            <p className="text-sm text-red-800 dark:text-red-200">
              WIP items are for internal use only. Please select "internal_use"
              for item usage.
            </p>
          </div>
        )}
      </form>
    );
  }
);
