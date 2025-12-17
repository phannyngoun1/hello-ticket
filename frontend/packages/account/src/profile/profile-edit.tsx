/**
 * Profile Edit Component
 *
 * Form to edit user profile information.
 */

import React, { useState, useEffect } from "react";
import { Card } from "@truths/ui";
import { Button } from "@truths/ui";
import { Input } from "@truths/ui";
import { Label } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { AccountComponentMetadata } from "../registry";
import { Profile, UpdateProfileInput } from "../types";

export interface ProfileEditProps {
  className?: string;
  profile: Profile;
  onSubmit: (data: UpdateProfileInput) => Promise<void> | void;
  onCancel?: () => void;
  onSuccess?: () => void;
  loading?: boolean;
  showSocialLinks?: boolean;
  showBio?: boolean;
}

export function ProfileEdit({
  className,
  profile,
  onSubmit,
  onCancel,
  onSuccess,
  loading = false,
  showSocialLinks = true,
  showBio = true,
}: ProfileEditProps) {
  const [formData, setFormData] = useState<UpdateProfileInput>({
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    username: profile.username || "",
    phone: profile.phone || "",
    location: profile.location || "",
    website: profile.website || "",
    bio: profile.bio || "",
    socialLinks: {
      twitter: profile.socialLinks?.twitter || "",
      linkedin: profile.socialLinks?.linkedin || "",
      github: profile.socialLinks?.github || "",
    },
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      username: profile.username || "",
      phone: profile.phone || "",
      location: profile.location || "",
      website: profile.website || "",
      bio: profile.bio || "",
      socialLinks: {
        twitter: profile.socialLinks?.twitter || "",
        linkedin: profile.socialLinks?.linkedin || "",
        github: profile.socialLinks?.github || "",
      },
    });
  }, [profile]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};

    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      newErrors.website = "Website must be a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onSuccess?.();
    } catch (error) {
      setErrors({ _general: "Failed to update profile. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field.startsWith("socialLinks.")) {
      const socialField = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className={cn("p-6", className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Edit Profile</h3>
          <p className="text-sm text-muted-foreground">
            Update your profile information
          </p>
        </div>

        {errors._general && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            {errors._general}
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Basic Information</h4>

          <div className="grid gap-4 md:grid-cols-2">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="John"
                disabled={isSubmitting || loading}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Doe"
                disabled={isSubmitting || loading}
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleChange("username", e.target.value)}
              placeholder="johndoe"
              disabled={isSubmitting || loading}
            />
          </div>

          {/* Bio */}
          {showBio && (
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                disabled={isSubmitting || loading}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Contact Information</h4>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={isSubmitting || loading}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="San Francisco, CA"
                disabled={isSubmitting || loading}
              />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleChange("website", e.target.value)}
              placeholder="https://example.com"
              disabled={isSubmitting || loading}
            />
            {errors.website && (
              <p className="text-sm text-destructive">{errors.website}</p>
            )}
          </div>
        </div>

        {/* Social Links */}
        {showSocialLinks && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Social Links</h4>

            {/* Twitter */}
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">@</span>
                <Input
                  id="twitter"
                  value={formData.socialLinks?.twitter}
                  onChange={(e) =>
                    handleChange("socialLinks.twitter", e.target.value)
                  }
                  placeholder="username"
                  disabled={isSubmitting || loading}
                />
              </div>
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formData.socialLinks?.linkedin}
                onChange={(e) =>
                  handleChange("socialLinks.linkedin", e.target.value)
                }
                placeholder="https://linkedin.com/in/username"
                disabled={isSubmitting || loading}
              />
            </div>

            {/* GitHub */}
            <div className="space-y-2">
              <Label htmlFor="github">GitHub</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">@</span>
                <Input
                  id="github"
                  value={formData.socialLinks?.github}
                  onChange={(e) =>
                    handleChange("socialLinks.github", e.target.value)
                  }
                  placeholder="username"
                  disabled={isSubmitting || loading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || loading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || loading}>
            {isSubmitting || loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function profileEditMetadata(): AccountComponentMetadata {
  return {
    name: "Profile Edit",
    description: "Form to edit user profile information",
    category: "profile",
    tags: ["profile", "user", "edit", "form"],
    version: "1.0.0",
    dependencies: ["@truths/ui"],
  };
}
