import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useUpdateClients } from '../hooks/useQueries';
import type { Client } from '../backend';
import { Type__1, Type__3, Type__4 } from '../backend';

interface BulkEditClientsDialogProps {
  clients: Client[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BulkEditClientsDialog({ clients, open, onOpenChange }: BulkEditClientsDialogProps) {
  const [updateStatus, setUpdateStatus] = useState(false);
  const [status, setStatus] = useState<Type__4>(Type__4.active);
  const [updateTaskCategory, setUpdateTaskCategory] = useState(false);
  const [taskCategory, setTaskCategory] = useState<Type__3>(Type__3.GST);
  const [updateRecurring, setUpdateRecurring] = useState(false);
  const [recurring, setRecurring] = useState<Type__1>(Type__1.none);
  const updateClients = useUpdateClients();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedClients = clients.map((client) => ({
      ...client,
      status: updateStatus ? status : client.status,
      taskCategory: updateTaskCategory ? taskCategory : client.taskCategory,
      recurring: updateRecurring ? recurring : client.recurring,
    }));

    const clientIds = clients.map((c) => c.id);

    updateClients.mutate(
      { clientIds, clients: updatedClients },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Edit Clients</DialogTitle>
          <DialogDescription>Update {clients.length} selected client(s). Only checked fields will be updated.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="updateStatus" checked={updateStatus} onCheckedChange={(checked) => setUpdateStatus(checked === true)} />
              <Label htmlFor="updateStatus" className="flex-1">
                Update Status
              </Label>
              {updateStatus && (
                <Select value={status} onValueChange={(value: Type__4) => setStatus(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Type__4.active}>Active</SelectItem>
                    <SelectItem value={Type__4.inactive}>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateTaskCategory"
                checked={updateTaskCategory}
                onCheckedChange={(checked) => setUpdateTaskCategory(checked === true)}
              />
              <Label htmlFor="updateTaskCategory" className="flex-1">
                Update Task Category
              </Label>
              {updateTaskCategory && (
                <Select value={taskCategory} onValueChange={(value: Type__3) => setTaskCategory(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Type__3.GST}>GST</SelectItem>
                    <SelectItem value={Type__3.Audit}>Audit</SelectItem>
                    <SelectItem value={Type__3.ITNotice}>IT Notice</SelectItem>
                    <SelectItem value={Type__3.TDS}>TDS</SelectItem>
                    <SelectItem value={Type__3.Other}>Others</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateRecurring"
                checked={updateRecurring}
                onCheckedChange={(checked) => setUpdateRecurring(checked === true)}
              />
              <Label htmlFor="updateRecurring" className="flex-1">
                Update Recurring
              </Label>
              {updateRecurring && (
                <Select value={recurring} onValueChange={(value: Type__1) => setRecurring(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Type__1.none}>None</SelectItem>
                    <SelectItem value={Type__1.monthly}>Monthly</SelectItem>
                    <SelectItem value={Type__1.quarterly}>Quarterly</SelectItem>
                    <SelectItem value={Type__1.yearly}>Yearly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateClients.isPending || (!updateStatus && !updateTaskCategory && !updateRecurring)}>
              {updateClients.isPending ? 'Updating...' : 'Update Clients'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
