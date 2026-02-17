/**
 * View Customer Page Component
 *
 * Full-featured page for viewing a single customer.
 * Handles data fetching, edit/delete/activate/deactivate, create booking,
 * tags, attachments, profile photo, and tab title updates.
 * Must be used within CustomerProvider (e.g. from domain providers).
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@truths/ui";
import { ConfirmationDialog } from "@truths/custom-ui";
import { CustomerDetail } from "./customer-detail";
import { useCustomer, useUpdateCustomer, useDeleteCustomer } from "./use-customers";
import { useCustomerService } from "./customer-provider";
import { EditCustomerDialog } from "./edit-customer-dialog";
import { CustomerTagsDialog } from "./customer-tags-dialog";
import { CustomerAttachmentsDialog } from "./customer-attachments-dialog";
import { CreateBookingDialog } from "../bookings/create-booking-dialog";
import { useCreateBooking } from "../bookings/use-bookings";
import type { Customer, UpdateCustomerInput } from "../types";
import type { CreateBookingInput } from "../bookings/types";
import { TagService, AttachmentService, type FileUpload } from "@truths/shared";
import { BookingService } from "../bookings/booking-service";
import type { ServiceConfig } from "@truths/shared";
import type { AttachmentServiceConfig } from "@truths/shared";
import type { BookingServiceConfig } from "../bookings/booking-service";

export interface ViewCustomerPageConfig {
  tag: ServiceConfig<{ tags: string }>;
  attachment: AttachmentServiceConfig;
  booking: BookingServiceConfig;
}

export interface ViewCustomerPageProps {
  customerId: string;
  config: ViewCustomerPageConfig;
  /** Called after delete - navigate to customers list */
  onNavigateToCustomers?: () => void;
  /** Called to view bookings filtered by customer */
  onNavigateToBookings?: (customerId: string) => void;
  /** Called after creating a booking - navigate to the new booking */
  onNavigateToBooking?: (bookingId: string) => void;
}

function CustomerDetailContent({
  customerId,
  tagService,
  attachmentService,
  bookingService,
  onNavigateToCustomers,
  onNavigateToBookings,
  onNavigateToBooking,
}: {
  customerId: string;
  tagService: TagService;
  attachmentService: AttachmentService;
  bookingService: BookingService;
  onNavigateToCustomers?: () => void;
  onNavigateToBookings?: (customerId: string) => void;
  onNavigateToBooking?: (bookingId: string) => void;
}) {
  const service = useCustomerService();
  const { toast } = useToast();
  const {
    data: customer,
    isLoading,
    error,
    refetch,
  } = useCustomer(service, customerId ?? null);
  const updateMutation = useUpdateCustomer(service);
  const deleteMutation = useDeleteCustomer(service);
  const createBookingMutation = useCreateBooking(bookingService);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
  const [createBookingDialogOpen, setCreateBookingDialogOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<FileUpload | null>(null);

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
          path: `/sales/customers/${customerId}`,
          title,
        },
      }),
    );
  }, [customerId, customer]);

  const handleEdit = useCallback(() => setEditDialogOpen(true), []);
  const handleDelete = useCallback(() => setDeleteDialogOpen(true), []);
  const handleActivate = useCallback(() => setActivateDialogOpen(true), []);
  const handleDeactivate = useCallback(() => setDeactivateDialogOpen(true), []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!customer) return;
    try {
      await deleteMutation.mutateAsync(customer.id);
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      onNavigateToCustomers?.();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to delete customer",
        variant: "destructive",
      });
    }
    setDeleteDialogOpen(false);
  }, [customer, deleteMutation, toast, onNavigateToCustomers]);

  const handleActivateConfirm = useCallback(async () => {
    if (!customer) return;
    try {
      await updateMutation.mutateAsync({
        id: customer.id,
        input: { status: "active" },
      });
      await refetch();
      toast({
        title: "Success",
        description: "Customer activated successfully",
      });
      setActivateDialogOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to activate customer",
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
      await refetch();
      toast({
        title: "Success",
        description: "Customer deactivated successfully",
      });
      setDeactivateDialogOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to deactivate customer",
        variant: "destructive",
      });
    }
  }, [customer, updateMutation, toast, refetch]);

  const handleEditSubmit = useCallback(
    async (id: string, data: UpdateCustomerInput) => {
      try {
        await updateMutation.mutateAsync({ id, input: data });
        await refetch();
        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
        setEditDialogOpen(false);
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to update customer",
          variant: "destructive",
        });
        throw err;
      }
    },
    [updateMutation, toast, refetch],
  );

  const handleCreateBooking = useCallback((_: Customer) => {
    setCreateBookingDialogOpen(true);
  }, []);

  const handleCreateBookingSubmit = useCallback(
    async (data: CreateBookingInput) => {
      try {
        const booking = await createBookingMutation.mutateAsync(data);
        toast({
          title: "Success",
          description: "Booking created successfully",
        });
        setCreateBookingDialogOpen(false);
        onNavigateToBooking?.(booking.id);
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to create booking",
          variant: "destructive",
        });
        throw err;
      }
    },
    [createBookingMutation, onNavigateToBooking, toast],
  );

  const handleViewBookings = useCallback(
    (cus: Customer) => {
      onNavigateToBookings?.(cus.id);
    },
    [onNavigateToBookings],
  );

  const handleManageTags = useCallback(() => setTagsDialogOpen(true), []);
  const handleManageAttachments = useCallback(
    () => setAttachmentsDialogOpen(true),
    [],
  );

  const handleTagsSave = useCallback(
    async (tags: string[]) => {
      if (!customer) return;
      try {
        await tagService.manageEntityTags("customer", customer.id, tags);
        await refetch();
        toast({
          title: "Success",
          description: "Tags updated successfully",
        });
        setTagsDialogOpen(false);
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to update tags",
          variant: "destructive",
        });
        throw err;
      }
    },
    [customer, refetch, toast, tagService],
  );

  const handleProfilePhotoChange = useCallback(
    async (photo: FileUpload | null) => {
      setProfilePhoto(photo);
      await refetchProfilePhoto();
    },
    [refetchProfilePhoto],
  );

  const handleAttachmentsSave = useCallback(
    async (_: FileUpload[]) => {
      toast({
        title: "Success",
        description: "Attachments updated successfully",
      });
    },
    [toast],
  );

  return (
    <>
      <CustomerDetail
        cus={customer ?? undefined}
        loading={isLoading}
        error={error as Error | null}
        editable={true}
        attachmentService={attachmentService}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onCreateBooking={handleCreateBooking}
        onViewBookings={handleViewBookings}
        onManageTags={handleManageTags}
        onManageAttachments={handleManageAttachments}
        profilePhoto={profilePhoto}
        onProfilePhotoChange={handleProfilePhotoChange}
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
            onOpenChange={setDeleteDialogOpen}
            title="Delete Customer"
            description={`Are you sure you want to delete "${customer.name || customer.code}"? This action cannot be undone.`}
            confirmText="delete"
            confirmTextLabel={
              <>
                Type <span className="font-mono font-semibold">delete</span> to
                confirm:
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
            onOpenChange={setActivateDialogOpen}
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
            onOpenChange={setDeactivateDialogOpen}
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

          <CreateBookingDialog
            open={createBookingDialogOpen}
            onOpenChange={setCreateBookingDialogOpen}
            onSubmit={handleCreateBookingSubmit}
            initialCustomerId={customer.id}
          />
        </>
      )}
    </>
  );
}

export function ViewCustomerPage({
  customerId,
  config,
  onNavigateToCustomers,
  onNavigateToBookings,
  onNavigateToBooking,
}: ViewCustomerPageProps) {
  const tagService = useMemo(
    () => new TagService(config.tag),
    [config.tag],
  );
  const attachmentService = useMemo(
    () => new AttachmentService(config.attachment),
    [config.attachment],
  );
  const bookingService = useMemo(
    () => new BookingService(config.booking),
    [config.booking],
  );

  return (
    <CustomerDetailContent
      customerId={customerId}
      tagService={tagService}
      attachmentService={attachmentService}
      bookingService={bookingService}
      onNavigateToCustomers={onNavigateToCustomers}
      onNavigateToBookings={onNavigateToBookings}
      onNavigateToBooking={onNavigateToBooking}
    />
  );
}
