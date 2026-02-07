/**
 * Show Form Component
 *
 * Shared form used for creating and editing shows with Zod validation.
 */

import { forwardRef, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import {
  Input,
  Field,
  FieldLabel,
  FieldError,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { AIAssistFormButton, TextareaInputField } from "@truths/custom-ui";

// Form schema excludes timestamp fields (created_at, updated_at) as they are backend-managed
const showFormSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    organizer_id: z.string().optional(),
    started_date: z.string().optional(),
    ended_date: z.string().optional(),
    note: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.started_date && data.ended_date) {
        return new Date(data.started_date) <= new Date(data.ended_date);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["ended_date"],
    }
  )
  .transform((values) => values);

export type ShowFormData = z.infer<typeof showFormSchema>;

export interface ShowFormProps {
  defaultValues?: Partial<ShowFormData>;
  onSubmit: (data: ShowFormData) => Promise<void> | void;
  isLoading?: boolean;
  mode?: "create" | "edit";
  organizers?: Array<{ id: string; name: string }>;
}

export const ShowForm = forwardRef<HTMLFormElement, ShowFormProps>(
  function ShowForm(
    {
      defaultValues,
      onSubmit,
      isLoading = false,
      mode = "create",
      organizers = [],
    },
    ref
  ) {
    const [organizerPopoverOpen, setOrganizerPopoverOpen] = useState(false);
    
    const {
      register,
      control,
      handleSubmit,
      watch,
      setValue,
      formState: { errors, isSubmitted },
    } = useForm<ShowFormData>({
      resolver: zodResolver(showFormSchema),
      defaultValues: {
        name: "",
        organizer_id: undefined,
        started_date: undefined,
        ended_date: undefined,
        note: undefined,
        ...defaultValues,
      },
    });

    const firstErrorRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (isSubmitted && Object.keys(errors).length > 0) {
        const firstErrorField = Object.keys(errors)[0];
        const errorElement = document.querySelector(
          `[name="${firstErrorField}"], #${firstErrorField}`
        ) as HTMLElement | null;

        if (errorElement) {
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
          errorElement.focus?.();
        } else if (firstErrorRef.current) {
          firstErrorRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    }, [errors, isSubmitted]);

    const handleFormSubmit = async (data: ShowFormData) => {
      await onSubmit(data);
    };

    const showCurrentValues: Record<string, string> = {
      name: watch("name") ?? "",
      organizer_id: watch("organizer_id") ?? "",
      started_date: watch("started_date") ?? "",
      ended_date: watch("ended_date") ?? "",
      note: watch("note") ?? "",
    };

    return (
      <form
        ref={ref}
        id="show-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        <div className="flex justify-end">
          <AIAssistFormButton
            formType="show"
            currentValues={showCurrentValues}
            onSuggest={(values) => {
              Object.entries(values).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                  if (key === "organizer_id") {
                    const byId = organizers.find((o) => o.id === value);
                    const byName = organizers.find((o) => o.name === value);
                    setValue(
                      "organizer_id",
                      byId ? byId.id : byName ? byName.id : value
                    );
                  } else {
                    setValue(key as keyof ShowFormData, value);
                  }
                }
              });
            }}
            disabled={isLoading}
          />
        </div>
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4")}
          ref={firstErrorRef}
        >
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">
              Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="name"
              type="text"
              placeholder="Enter Name"
              {...register("name")}
              disabled={isLoading}
              className={cn(errors.name && "border-destructive")}
            />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>
          
          <Field data-invalid={!!errors.organizer_id}>
            <FieldLabel htmlFor="organizer_id">
              Organizer
            </FieldLabel>
            <Popover open={organizerPopoverOpen} onOpenChange={setOrganizerPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="organizer_id"
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between",
                    !watch("organizer_id") && "text-muted-foreground",
                    errors.organizer_id && "border-destructive"
                  )}
                  disabled={isLoading}
                >
                  {watch("organizer_id")
                    ? organizers.find((org) => org.id === watch("organizer_id"))?.name || "Select organizer"
                    : "Select an organizer (optional)"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search organizers..." />
                  <CommandList>
                    <CommandEmpty>No organizer found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="__none__"
                        onSelect={() => {
                          setValue("organizer_id", undefined);
                          setOrganizerPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !watch("organizer_id") ? "opacity-100" : "opacity-0"
                          )}
                        />
                        None
                      </CommandItem>
                      {organizers.map((org) => (
                        <CommandItem
                          key={org.id}
                          value={org.name}
                          onSelect={() => {
                            setValue("organizer_id", org.id);
                            setOrganizerPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              watch("organizer_id") === org.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {org.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FieldError>{errors.organizer_id?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.started_date}>
            <FieldLabel htmlFor="started_date">
              Start Date
            </FieldLabel>
            <Input
              id="started_date"
              type="date"
              {...register("started_date")}
              disabled={isLoading}
              className={cn(errors.started_date && "border-destructive")}
            />
            <FieldError>{errors.started_date?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.ended_date}>
            <FieldLabel htmlFor="ended_date">
              End Date
            </FieldLabel>
            <Input
              id="ended_date"
              type="date"
              {...register("ended_date")}
              disabled={isLoading}
              className={cn(errors.ended_date && "border-destructive")}
            />
            <FieldError>{errors.ended_date?.message}</FieldError>
          </Field>
        </div>

        <TextareaInputField
          control={control}
          name="note"
          label="Note"
          placeholder="Enter notes about the show"
          rows={4}
          disabled={isLoading}
          showImproveButton
        />
      </form>
    );
  }
);

