/**
 * View Customer Page
 *
 * @author Phanny
 */

import { useEffect, useCallback, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  CustomerDetail,
  useCustomer,
  useCustomerService,
  useUpdateCustomer,
  useDeleteCustomer,
  EditCustomerDialog,
  CustomerTagsDialog,
  ProfilePhotoUpload,
  CustomerAttachmentsDialog,
  type Customer,
} from "@truths/sales";
import { ConfirmationDialog } from "@truths/custom-ui";
import { useToast } from "@truths/ui";
import { TagService, AttachmentService, FileUpload } from "@truths/shared";
import { api } from "@truths/api";
import { useQuery } from "@tanstack/react-query";

function CustomerDetailContent({ id }: { id: string }) {
  const navigate = useNavigate();
  const service = useCustomerService();
  const { data: customer, isLoading, error, refetch } = useCustomer(service, id ?? null);
  const updateMutation = useUpdateCustomer(service);
  const deleteMutation = useDeleteCustomer(service);
  const { toast } = useToast();
  
  const tagService = new TagService({ apiClient: api });
  const attachmentService = new AttachmentService({ apiClient: api });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<FileUpload | null>(null);

  // Load profile photo
  const { data: profilePhotoData, refetch: refetchProfilePhoto } = useQuery({
    queryKey: ["profilePhoto", customer?.id, "customer"],
    queryFn: () =>
      customer
        ? attachmentService.getProfilePhoto("customer", customer.id)
        : null,
    enabled: !!customer,
  });

  useEffect(() => {
    setProfilePhoto(profilePhotoData || null);
  }, [profilePhotoData]);

  useEffect(() => {
    if (!customer) return;
    const title = customer.code || customer.name || customer.id;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/sales/customers/${id}`,
          title,
          iconName: "Users",
        },
      })
    );
  }, [id, customer]);

  const handleEdit = useCallback((cus: Customer) => {
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback((cus: Customer) => {
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!customer) return;
    try {
      await deleteMutation.mutateAsync(customer.id);
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      navigate({ to: "/sales/customers" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete customer",
        variant: "destructive",
      });
    }
    setDeleteDialogOpen(false);
  }, [customer, deleteMutation, toast, navigate]);

  const handleActivate = useCallback((cus: Customer) => {
    setActivateDialogOpen(true);
  }, []);

  const handleDeactivate = useCallback((cus: Customer) => {
    setDeactivateDialogOpen(true);
  }, []);

  const handleActivateConfirm = useCallback(async () => {
    if (!customer) return;
    try {
      await updateMutation.mutateAsync({
        id: customer.id,
        input: { status: "active" },
      });
      // Invalidate and refetch to update UI immediately
      await refetch();
      toast({
        title: "Success",
        description: "Customer activated successfully",
      });
      setActivateDialogOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to activate customer",
        variant: "destructive",
      });
    }
  }, [customer, updateMutation, toast, refetch]);

  const handleDeactivateConfirm = useCallback(async () => {
    if (!customer) return;
    try {
      await updateMutation.mutateAsync({
        id: customer.id,
        input: { status: "inactive" },
      });
      // Invalidate and refetch to update UI immediately
      await refetch();
      toast({
        title: "Success",
        description: "Customer deactivated successfully",
      });
      setDeactivateDialogOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to deactivate customer",
        variant: "destructive",
      });
    }
  }, [customer, updateMutation, toast, refetch]);

  const handleEditSubmit = useCallback(
    async (id: string, data: any) => {
      try {
        await updateMutation.mutateAsync({
          id: id,
          input: data,
        });
        // Invalidate and refetch to update UI immediately
        await refetch();
        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
        setEditDialogOpen(false);
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to update customer",
          variant: "destructive",
        });
        throw err;
      }
    },
    [updateMutation, toast, refetch]
  );

  const handleCreateBooking = useCallback(
    (cus: Customer) => {
      navigate({
        to: "/sales/bookings/create",
        search: { customer_id: cus.id },
      });
    },
    [navigate]
  );

  const handleViewBookings = useCallback(
    (cus: Customer) => {
      navigate({
        to: "/sales/bookings",
        search: { customer_id: cus.id },
      });
    },
    [navigate]
  );

  const handleManageTags = useCallback((cus: Customer) => {
    setTagsDialogOpen(true);
  }, []);

  const handleTagsSave = useCallback(
    async (tags: string[]) => {
      if (!customer) return;
      try {
        // Use unified service to manage tags (creates new tags and attaches them in one operation)
        await tagService.manageEntityTags("customer", customer.id, tags);
        
        // Refetch customer to get updated tags
        await refetch();
        toast({
          title: "Success",
          description: "Tags updated successfully",
        });
        setTagsDialogOpen(false);
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to update tags",
          variant: "destructive",
        });
        throw err;
      }
    },
    [customer, refetch, toast, tagService]
  );

  const handleProfilePhotoChange = useCallback(
    async (photo: FileUpload | null) => {
      setProfilePhoto(photo);
      await refetchProfilePhoto();
    },
    [refetchProfilePhoto]
  );

  const handleManageAttachments = useCallback((cus: Customer) => {
    setAttachmentsDialogOpen(true);
  }, []);

  const handleAttachmentsSave = useCallback(
    async (attachments: FileUpload[]) => {
      // Attachments are already saved, just refetch if needed
      toast({
        title: "Success",
        description: "Attachments updated successfully",
      });
    },
    [toast]
  );

  return (
    <>
      <CustomerDetail
        cus={customer ?? undefined}
        loading={isLoading}
        error={error as Error | null}
        editable={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onCreateBooking={handleCreateBooking}
        onViewBookings={handleViewBookings}
        onManageTags={handleManageTags}
        onManageAttachments={handleManageAttachments}
        profilePhoto={profilePhoto}
        profilePhotoComponent={
          customer ? (
            <ProfilePhotoUpload
              customer={customer}
              attachmentService={attachmentService}
              currentPhoto={profilePhoto}
              onPhotoChange={handleProfilePhotoChange}
            />
          ) : undefined
        }
      />

      {customer && (
        <>
          <EditCustomerDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            customer={customer}
            onSubmit={handleEditSubmit}
          />

          <ConfirmationDialog
            open={deleteDialogOpen}
            onOpenChange={(open) => {
              setDeleteDialogOpen(open);
            }}
            title="Delete Customer"
            description={`Are you sure you want to delete "${customer.name || customer.code}"? This action cannot be undone.`}
            confirmText="delete"
            confirmTextLabel={
              <>
                Type <span className="font-mono font-semibold">delete</span> to confirm:
              </>
            }
            confirmTextPlaceholder="Type 'delete' to confirm"
            confirmAction={{
              label: "Delete",
              onClick: handleDeleteConfirm,
              variant: "destructive",
              type: "delete",
              loading: deleteMutation.isPending,
              disabled: deleteMutation.isPending,
            }}
            cancelAction={{
              label: "Cancel",
              onClick: () => setDeleteDialogOpen(false),
              disabled: deleteMutation.isPending,
            }}
          />

          <ConfirmationDialog
            open={activateDialogOpen}
            onOpenChange={(open) => {
              setActivateDialogOpen(open);
            }}
            title="Activate Customer"
            description={`Are you sure you want to activate "${customer.name || customer.code}"? This will make the customer active and available for bookings.`}
            confirmAction={{
              label: "Activate",
              onClick: handleActivateConfirm,
              variant: "default",
              loading: updateMutation.isPending,
              disabled: updateMutation.isPending,
            }}
            cancelAction={{
              label: "Cancel",
              onClick: () => setActivateDialogOpen(false),
              disabled: updateMutation.isPending,
            }}
          />

          <ConfirmationDialog
            open={deactivateDialogOpen}
            onOpenChange={(open) => {
              setDeactivateDialogOpen(open);
            }}
            title="Deactivate Customer"
            description={`Are you sure you want to deactivate "${customer.name || customer.code}"? This will make the customer inactive and unavailable for new bookings.`}
            confirmAction={{
              label: "Deactivate",
              onClick: handleDeactivateConfirm,
              variant: "default",
              loading: updateMutation.isPending,
              disabled: updateMutation.isPending,
            }}
            cancelAction={{
              label: "Cancel",
              onClick: () => setDeactivateDialogOpen(false),
              disabled: updateMutation.isPending,
            }}
          />

          <CustomerTagsDialog
            open={tagsDialogOpen}
            onOpenChange={setTagsDialogOpen}
            customer={customer}
            tagService={tagService}
            onSave={handleTagsSave}
            loading={false}
          />

          <CustomerAttachmentsDialog
            open={attachmentsDialogOpen}
            onOpenChange={setAttachmentsDialogOpen}
            customer={customer}
            attachmentService={attachmentService}
            onSave={handleAttachmentsSave}
            loading={false}
          />
        </>
      )}
    </>
  );
}

export function ViewCustomerPage() {
  const { id } = useParams({ from: "/sales/customers/$id" });

  return <CustomerDetailContent id={id} />;
}
