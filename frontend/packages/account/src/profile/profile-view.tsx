/**
 * Profile View Component
 *
 * Display user profile information with optional edit functionality.
 */

import React from "react";
import { Card } from "@truths/ui";
import { Button } from "@truths/ui";
import { Badge } from "@truths/ui";
import { Avatar } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { AccountComponentMetadata } from "../registry";
import { Profile } from "../types";
import { Edit, Key } from "lucide-react";
import { useDensityStyles } from "@truths/utils";

export interface ProfileViewProps {
  className?: string;
  profile?: Profile;
  loading?: boolean;
  error?: Error | null;
  editable?: boolean;
  showSocialLinks?: boolean;
  showPreferences?: boolean;
  onEdit?: () => void;
  onPasswordChange?: () => void;
  customActions?: React.ReactNode;
}

export function ProfileView({
  className,
  profile,
  loading = false,
  error = null,
  editable = true,
  showSocialLinks = true,
  showPreferences = false,
  onEdit,
  onPasswordChange,
  customActions,
}: ProfileViewProps) {
  const density = useDensityStyles();
  
  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Card>
    );
  }

  if (error || !profile) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error?.message || "Profile not found"}
        </div>
      </Card>
    );
  }

  const getDisplayName = () => {
    if (profile.firstName || profile.lastName) {
      return `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
    }
    return profile.username || profile.email;
  };

  const getStatusBadge = () => {
    const variants: Record<
      Profile["status"],
      "default" | "secondary" | "destructive" | "outline"
    > = {
      active: "default",
      inactive: "secondary",
      suspended: "destructive",
      pending: "outline",
    };
    return <Badge variant={variants[profile.status]}>{profile.status}</Badge>;
  };

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
              {profile.avatar ? (
                <img src={profile.avatar} alt={getDisplayName()} />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-3xl font-medium">
                  {getDisplayName().charAt(0).toUpperCase()}
                </div>
              )}
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{getDisplayName()}</h2>
              {profile.username && (
                <p className="text-sm text-muted-foreground">
                  @{profile.username}
                </p>
              )}
              {profile.bio && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {profile.bio}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                {getStatusBadge()}
                <Badge variant="outline">
                  {profile.role || profile.baseRole || "User"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {customActions}
            {editable && onEdit && (
              <Button onClick={onEdit} className={cn("flex items-center gap-1.5", density.textSizeSmall)}>
                <Edit className={density.iconSizeSmall} />
                <span>Edit Profile</span>
              </Button>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            Contact Information
          </h3>
          <dl className="grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium">Email</dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                {profile.email}
              </dd>
            </div>
            {profile.phone && (
              <div>
                <dt className="text-sm font-medium">Phone</dt>
                <dd className="mt-1 text-sm text-muted-foreground">
                  {profile.phone}
                </dd>
              </div>
            )}
            {profile.location && (
              <div>
                <dt className="text-sm font-medium">Location</dt>
                <dd className="mt-1 text-sm text-muted-foreground">
                  {profile.location}
                </dd>
              </div>
            )}
            {profile.website && (
              <div>
                <dt className="text-sm font-medium">Website</dt>
                <dd className="mt-1 text-sm">
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {profile.website}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Social Links */}
        {showSocialLinks && profile.socialLinks && (
          <div>
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">
              Social Links
            </h3>
            <div className="flex flex-wrap gap-3">
              {profile.socialLinks.twitter && (
                <a
                  href={`https://twitter.com/${profile.socialLinks.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Twitter
                </a>
              )}
              {profile.socialLinks.linkedin && (
                <a
                  href={profile.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  LinkedIn
                </a>
              )}
              {profile.socialLinks.github && (
                <a
                  href={`https://github.com/${profile.socialLinks.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  GitHub
                </a>
              )}
            </div>
          </div>
        )}

        {/* Preferences */}
        {showPreferences && profile.preferences && (
          <div>
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">
              Preferences
            </h3>
            <dl className="grid gap-4 md:grid-cols-2">
              {profile.preferences.theme && (
                <div>
                  <dt className="text-sm font-medium">Theme</dt>
                  <dd className="mt-1 text-sm text-muted-foreground capitalize">
                    {profile.preferences.theme}
                  </dd>
                </div>
              )}
              {profile.preferences.language && (
                <div>
                  <dt className="text-sm font-medium">Language</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">
                    {profile.preferences.language}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 border-t pt-4">
          {onPasswordChange && (
            <Button variant="outline" onClick={onPasswordChange} className={cn("flex items-center gap-1.5", density.textSizeSmall)}>
              <Key className={density.iconSizeSmall} />
              <span>Change Password</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function profileViewMetadata(): AccountComponentMetadata {
  return {
    name: "Profile View",
    description: "Display user profile information",
    category: "profile",
    tags: ["profile", "user", "view", "display"],
    version: "1.0.0",
    dependencies: ["@truths/ui"],
  };
}
