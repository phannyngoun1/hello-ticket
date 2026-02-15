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
    <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
      <Label
        htmlFor={id}
        className="flex flex-col items-center justify-center w-full h-full py-12 cursor-pointer gap-4"
      >
        <div className="bg-white p-4 rounded-full shadow-sm ring-1 ring-gray-200/50">
          <Upload className="h-6 w-6 text-gray-500" />
        </div>
        <div className="text-center space-y-1">
          <span className="text-base font-medium text-gray-900 block">
            {isUploading ? "Uploading..." : label}
          </span>
          <p className="text-sm text-gray-500">
            Click to select an image from your device
          </p>
        </div>
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

