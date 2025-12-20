/**
 * Organizer Form Component
 *
 * Shared form used for creating and editing organizers with Zod validation.
 */

import { forwardRef, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Input,
  Field,
  FieldLabel,
  FieldError,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";

// Form schema excludes timestamp fields (created_at, updated_at) as they are backend-managed
const organizerFormSchema = z
  .object({
    
    
    code: z.string().optional(),
    
    
    
    name: z.string().min(1, "Name is required"),
    
    
  })
  .transform((values) => values);

export type OrganizerFormData = z.infer<typeof organizerFormSchema>;

export interface OrganizerFormProps {
  defaultValues?: Partial<OrganizerFormData>;
  onSubmit: (data: OrganizerFormData) => Promise<void> | void;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export const OrganizerForm = forwardRef<HTMLFormElement, OrganizerFormProps>(
  function OrganizerForm(
    {
      defaultValues,
      onSubmit,
      isLoading = false,
      mode = "create",
    },
    ref
  ) {
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitted },
    } = useForm<OrganizerFormData>({
      resolver: zodResolver(organizerFormSchema),
      defaultValues: {
        
        
        code: undefined,
        
        
        
        name: "",
        
        
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

    const handleFormSubmit = async (data: OrganizerFormData) => {
      await onSubmit(data);
    };

    return (
      <form
        ref={ref}
        id="organizer-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4")}
          ref={firstErrorRef}
        >
          
          
          <Field data-invalid={!!errors.code}>
            <FieldLabel htmlFor="code">
              Code
            </FieldLabel>
            
              
                
                {(() => {
                  const isCodeLocked =
                    (true && mode === "edit") ||
                    (true && mode === "create");
                  const lockReason =
                    true && mode === "edit"
                      ? "Codes cannot be modified after creation"
                      : true && mode === "create"
                        ? "Code will be generated automatically"
                        : undefined;
                  return (
                    <Input
                      id="code"
                      type="text"
                      placeholder="Auto generated"
                      {...register("code")}
                      disabled={isLoading || isCodeLocked}
                      readOnly={isCodeLocked}
                      tabIndex={isCodeLocked ? -1 : undefined}
                      aria-disabled={isCodeLocked || undefined}
                      aria-readonly={isCodeLocked || undefined}
                      title={lockReason}
                      className={cn(
                        isCodeLocked && "cursor-not-allowed bg-muted text-muted-foreground",
                        errors.code && "border-destructive"
                      )}
                    />
                  );
                })()}
                
              
              <FieldError>{errors.code?.message}</FieldError>
            
          </Field>
          
          
          
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">
              Name <span className="text-destructive">*</span>
            </FieldLabel>
            
              
                
                {(() => {
                  const isCodeLocked =
                    (false && mode === "edit") ||
                    (false && mode === "create");
                  const lockReason =
                    false && mode === "edit"
                      ? "Codes cannot be modified after creation"
                      : false && mode === "create"
                        ? "Code will be generated automatically"
                        : undefined;
                  return (
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter Name"
                      {...register("name")}
                      disabled={isLoading || isCodeLocked}
                      readOnly={isCodeLocked}
                      tabIndex={isCodeLocked ? -1 : undefined}
                      aria-disabled={isCodeLocked || undefined}
                      aria-readonly={isCodeLocked || undefined}
                      title={lockReason}
                      className={cn(
                        isCodeLocked && "cursor-not-allowed bg-muted text-muted-foreground",
                        errors.name && "border-destructive"
                      )}
                    />
                  );
                })()}
                
              
              <FieldError>{errors.name?.message}</FieldError>
            
          </Field>
          
          
        </div>
      </form>
    );
  }
);

