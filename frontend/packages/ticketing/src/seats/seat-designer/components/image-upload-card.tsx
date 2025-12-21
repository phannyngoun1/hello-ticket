/**
 * Image Upload Card Component
 * 
 * Reusable card for uploading images
 */

import { Card, Input, Label } from "@truths/ui";
import { Upload } from "lucide-react";

export interface ImageUploadCardProps {
  id: string;
  label: string;
  isUploading?: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ImageUploadCard({
  id,
  label,
  isUploading = false,
  onFileSelect,
}: ImageUploadCardProps) {
  return (
    <Card className="p-8 text-center">
      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <Label htmlFor={id} className="cursor-pointer">
        <span className="text-sm font-medium text-gray-700">
          {isUploading ? "Uploading..." : label}
        </span>
        <Input
          id={id}
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="hidden"
          disabled={isUploading}
        />
      </Label>
    </Card>
  );
}

