import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus } from '@/components/ui/icons';
import { EventPhotosUpload } from './EventPhotosUpload';
import {
  EventsTable,
  EventFormDialog,
  DeleteConfirmDialog,
  LoadingState,
  useEventsManagement,
} from './events-management';

export function EventsManagementEnhanced() {
  const {
    events,
    isDialogOpen,
    setIsDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    editingEvent,
    deletingEvent,
    isLoading,
    fetchingEvents,
    photoUploadEvent,
    setPhotoUploadEvent,
    form,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    onSubmit,
    handleDelete,
    toggleEventStatus,
    moveToPastEvents,
    openPhotoUpload,
  } = useEventsManagement();

  if (fetchingEvents) {
    return <LoadingState />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Events Management
              </CardTitle>
              <CardDescription>Manage workshops, seminars, and other events</CardDescription>
            </div>
            <Button onClick={openCreateDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Event
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <EventsTable
            events={events}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
            onToggleStatus={toggleEventStatus}
            onMoveToPast={moveToPastEvents}
            onOpenPhotoUpload={openPhotoUpload}
          />
        </CardContent>
      </Card>

      <EventFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={onSubmit}
        form={form}
        isLoading={isLoading}
        isEditing={!!editingEvent}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        event={deletingEvent}
        isLoading={isLoading}
      />

      {photoUploadEvent && (
        <EventPhotosUpload
          eventId={Number(photoUploadEvent.id)}
          eventTitle={photoUploadEvent.title}
          isOpen={!!photoUploadEvent}
          onClose={() => setPhotoUploadEvent(null)}
        />
      )}
    </>
  );
}
