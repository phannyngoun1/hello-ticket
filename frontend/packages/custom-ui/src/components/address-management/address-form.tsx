/**
 * Address Form Component
 *
 * Generic form component for creating and editing addresses
 *
 * @author Phanny
 */

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Field,
  FieldLabel,
  FieldError,
  Checkbox,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { COUNTRIES } from "./constants";
import { CreateAddressInput, UpdateAddressInput } from "./types";

// Address form schema - address_type is optional, validation handled in submit
const addressFormSchema = z.object({
  name: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  address_type: z.string().optional(),
  is_default: z.boolean(),
  notes: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressFormSchema>;

export interface AddressFormProps<TAddressType extends string = string> {
  /**
   * Submit handler for the form
   */
  onSubmit: (
    data: CreateAddressInput<TAddressType> | UpdateAddressInput<TAddressType>
  ) => Promise<void>;

  /**
   * Default values for edit mode
   */
  defaultValues?: Partial<
    CreateAddressInput<TAddressType> | UpdateAddressInput<TAddressType>
  >;

  /**
   * Default address type when creating new address
   */
  defaultAddressType?: TAddressType;

  /**
   * Available address types
   */
  addressTypes: readonly TAddressType[];

  /**
   * Labels for address types
   */
  addressTypeLabels?: Record<TAddressType, string>;

  /**
   * Cancel handler
   */
  onCancel: () => void;
}

export function AddressForm<TAddressType extends string = string>({
  onSubmit,
  defaultValues,
  defaultAddressType,
  addressTypes,
  addressTypeLabels,
  onCancel,
}: AddressFormProps<TAddressType>) {
  const isEditMode = !!defaultValues;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      street: defaultValues?.street ?? "",
      city: defaultValues?.city ?? "",
      state: defaultValues?.state ?? "",
      postal_code: defaultValues?.postal_code ?? "",
      country: defaultValues?.country ?? "",
      address_type:
        (defaultValues?.address_type as string) ||
        defaultAddressType ||
        (addressTypes[0] as string),
      is_default: defaultValues?.is_default ?? false,
      notes: defaultValues?.notes ?? "",
    },
  });

  const addressType = watch("address_type") as TAddressType | undefined;

  const getAddressTypeLabel = (type: TAddressType): string => {
    return (
      addressTypeLabels?.[type] || type.charAt(0).toUpperCase() + type.slice(1)
    );
  };

  const onFormSubmit = async (data: AddressFormData) => {
    // Validate address_type for create mode
    if (!isEditMode && !data.address_type) {
      return;
    }

    // Convert empty strings to undefined for optional fields
    const submitData = {
      name: data.name?.trim() || undefined,
      street: data.street?.trim() || undefined,
      city: data.city?.trim() || undefined,
      state: data.state?.trim() || undefined,
      postal_code: data.postal_code?.trim() || undefined,
      country: data.country?.trim() || undefined,
      address_type: data.address_type as TAddressType,
      is_default: data.is_default,
      notes: data.notes?.trim() || undefined,
    } as CreateAddressInput<TAddressType> | UpdateAddressInput<TAddressType>;

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Address Name</FieldLabel>
          <Input
            id="name"
            {...register("name")}
            placeholder="e.g., Main Office, Warehouse, Headquarters"
            disabled={isSubmitting}
            className={cn(errors.name && "border-destructive")}
          />
          {errors.name ? (
            <FieldError>{errors.name.message}</FieldError>
          ) : (
            <FieldError className="text-xs text-muted-foreground">
              Optional: A descriptive name to identify this address
            </FieldError>
          )}
        </Field>

        {!isEditMode && (
          <Field data-invalid={!!errors.address_type}>
            <FieldLabel htmlFor="address_type">Address Type</FieldLabel>
            <Controller
              name="address_type"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="address_type"
                    className={cn(errors.address_type && "border-destructive")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {addressTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getAddressTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.address_type && (
              <FieldError>{errors.address_type.message}</FieldError>
            )}
          </Field>
        )}

        <Field className="md:col-span-2" data-invalid={!!errors.street}>
          <FieldLabel htmlFor="street">Street Address</FieldLabel>
          <Input
            id="street"
            {...register("street")}
            placeholder="Enter street address"
            disabled={isSubmitting}
            className={cn(errors.street && "border-destructive")}
          />
          {errors.street && <FieldError>{errors.street.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.city}>
          <FieldLabel htmlFor="city">City</FieldLabel>
          <Input
            id="city"
            {...register("city")}
            placeholder="Enter city"
            disabled={isSubmitting}
            className={cn(errors.city && "border-destructive")}
          />
          {errors.city && <FieldError>{errors.city.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.state}>
          <FieldLabel htmlFor="state">State/Province</FieldLabel>
          <Input
            id="state"
            {...register("state")}
            placeholder="Enter state or province"
            disabled={isSubmitting}
            className={cn(errors.state && "border-destructive")}
          />
          {errors.state && <FieldError>{errors.state.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.postal_code}>
          <FieldLabel htmlFor="postal_code">Postal Code</FieldLabel>
          <Input
            id="postal_code"
            {...register("postal_code")}
            placeholder="Enter postal code"
            disabled={isSubmitting}
            className={cn(errors.postal_code && "border-destructive")}
          />
          {errors.postal_code && (
            <FieldError>{errors.postal_code.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.country}>
          <FieldLabel htmlFor="country">Country</FieldLabel>
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onValueChange={(value) => field.onChange(value || "")}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="country"
                  className={cn(errors.country && "border-destructive")}
                >
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.country && <FieldError>{errors.country.message}</FieldError>}
        </Field>

        <Field>
          <div className="flex items-center space-x-2">
            <Controller
              name="is_default"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="is_default"
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(
                      checked === "indeterminate" ? false : checked
                    )
                  }
                  disabled={isSubmitting}
                />
              )}
            />
            <FieldLabel htmlFor="is_default" className="cursor-pointer">
              Set as default{" "}
              {addressType ? getAddressTypeLabel(addressType) : ""} address
            </FieldLabel>
          </div>
        </Field>
      </div>

      <Field data-invalid={!!errors.notes}>
        <FieldLabel htmlFor="notes">Notes</FieldLabel>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Additional notes (optional)"
          rows={3}
          disabled={isSubmitting}
          className={cn(errors.notes && "border-destructive")}
        />
        {errors.notes && <FieldError>{errors.notes.message}</FieldError>}
      </Field>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : isEditMode
              ? "Update Address"
              : "Add Address"}
        </Button>
      </div>
    </form>
  );
}
