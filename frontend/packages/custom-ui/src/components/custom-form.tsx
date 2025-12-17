/**
 * Custom Form Component
 *
 * @author Phanny
 */

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Checkbox,
  Switch,
} from "@truths/ui";
import { Save, X } from "lucide-react";

/**
 * Custom form component with advanced features
 *
 * Features:
 * - Dynamic field management
 * - Validation support
 * - Auto-save functionality
 * - Field dependencies
 * - Custom field types
 */

export interface FormField {
  id: string;
  name: string;
  type:
    | "text"
    | "email"
    | "number"
    | "select"
    | "textarea"
    | "checkbox"
    | "switch";
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  dependsOn?: string;
  showWhen?: (values: Record<string, any>) => boolean;
}

export interface CustomFormProps {
  title?: string;
  description?: string;
  fields: FormField[];
  initialValues?: Record<string, any>;
  onSubmit?: (values: Record<string, any>) => void;
  onSave?: (values: Record<string, any>) => void;
  autoSave?: boolean;
  autoSaveDelay?: number;
  className?: string;
}

export function CustomForm({
  title = "Custom Form",
  description = "Advanced form with dynamic fields",
  fields,
  initialValues = {},
  onSubmit,
  onSave,
  autoSave = false,
  autoSaveDelay = 2000,
  className = "",
}: CustomFormProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-save functionality
  React.useEffect(() => {
    if (autoSave && isDirty && onSave) {
      const timer = setTimeout(() => {
        onSave(values);
        setIsDirty(false);
      }, autoSaveDelay);
      return () => clearTimeout(timer);
    }
  }, [values, isDirty, autoSave, onSave, autoSaveDelay]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setIsDirty(true);

    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors((prev) => ({ ...prev, [fieldId]: "" }));
    }
  };

  const validateField = (field: FormField, value: any): string => {
    if (field.required && (!value || value === "")) {
      return `${field.label} is required`;
    }

    if (
      field.type === "email" &&
      value &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ) {
      return "Please enter a valid email address";
    }

    if (field.type === "number" && value && isNaN(Number(value))) {
      return "Please enter a valid number";
    }

    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      const error = validateField(field, values[field.id]);
      if (error) {
        newErrors[field.id] = error;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit?.(values);
      setIsDirty(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    // Check if field should be shown based on dependencies
    if (field.showWhen && !field.showWhen(values)) {
      return null;
    }

    const fieldValue = values[field.id] || "";
    const fieldError = errors[field.id];

    switch (field.type) {
      case "text":
      case "email":
      case "number":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              value={fieldValue}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={fieldError ? "border-red-500" : ""}
            />
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        );

      case "select":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={fieldValue}
              onValueChange={(value) => handleFieldChange(field.id, value)}
            >
              <SelectTrigger className={fieldError ? "border-red-500" : ""}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        );

      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={fieldValue}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={fieldError ? "border-red-500" : ""}
            />
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        );

      case "checkbox":
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={Boolean(fieldValue)}
              onCheckedChange={(checked) =>
                handleFieldChange(field.id, checked)
              }
            />
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        );

      case "switch":
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Switch
              id={field.id}
              checked={Boolean(fieldValue)}
              onCheckedChange={(checked) =>
                handleFieldChange(field.id, checked)
              }
            />
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(renderField)}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              {autoSave && isDirty && (
                <span className="text-sm text-muted-foreground">
                  Auto-saving...
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setValues(initialValues)}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
