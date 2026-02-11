import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useUpdateTasks, useGetAllTeamMembers } from '../hooks/useQueries';
import type { Task } from '../backend';
import { Type, Type__2, Type__3 } from '../backend';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

interface BulkEditTasksDialogProps {
  tasks: Task[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BulkEditTasksDialog({ tasks, open, onOpenChange }: BulkEditTasksDialogProps) {
  const [updateStatus, setUpdateStatus] = useState(false);
  const [status, setStatus] = useState<Type__2>(Type__2.pending);
  const [updateComment, setUpdateComment] = useState(false);
  const [comment, setComment] = useState('');
  const [updateTaskType, setUpdateTaskType] = useState(false);
  const [taskType, setTaskType] = useState<Type__3>(Type__3.GST);
  const [updateAssignedTo, setUpdateAssignedTo] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [updateDueDate, setUpdateDueDate] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [updateAssignmentDate, setUpdateAssignmentDate] = useState(false);
  const [assignmentDate, setAssignmentDate] = useState('');
  const [updateBill, setUpdateBill] = useState(false);
  const [bill, setBill] = useState('');
  const [updateAdvanceReceived, setUpdateAdvanceReceived] = useState(false);
  const [advanceReceived, setAdvanceReceived] = useState('');
  const [updatePaymentStatus, setUpdatePaymentStatus] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<Type>(Type.pending);
  const updateTasks = useUpdateTasks();
  const { data: teamMembers = [] } = useGetAllTeamMembers();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedMember = updateAssignedTo && assignedTo 
      ? teamMembers.find((m) => m.principal.toString() === assignedTo)
      : null;

    // Convert due date string to nanoseconds timestamp with validation
    let dueDateNano: bigint | undefined = undefined;
    if (updateDueDate && dueDate && dueDate.trim() !== '') {
      try {
        const dateObj = new Date(dueDate);
        if (isNaN(dateObj.getTime())) {
          toast.error('Invalid due date format');
          return;
        }
        dueDateNano = BigInt(dateObj.getTime()) * BigInt(1000000);
      } catch (error) {
        toast.error('Error processing due date');
        return;
      }
    }

    // Convert manual assignment date string to nanoseconds timestamp with validation
    let manualAssignmentDateNano: bigint | undefined = undefined;
    if (updateAssignmentDate && assignmentDate && assignmentDate.trim() !== '') {
      try {
        const dateObj = new Date(assignmentDate);
        if (isNaN(dateObj.getTime())) {
          toast.error('Invalid assignment date format');
          return;
        }
        manualAssignmentDateNano = BigInt(dateObj.getTime()) * BigInt(1000000);
      } catch (error) {
        toast.error('Error processing assignment date');
        return;
      }
    }

    // Parse advance received
    const advanceReceivedNat = updateAdvanceReceived && advanceReceived ? BigInt(Math.floor(parseFloat(advanceReceived))) : undefined;

    const updatedTasks = tasks.map((task) => ({
      ...task,
      status: updateStatus ? status : task.status,
      comment: updateComment ? (comment.trim() || undefined) : task.comment,
      taskType: updateTaskType ? taskType : task.taskType,
      assignedTo: updateAssignedTo && assignedTo ? Principal.fromText(assignedTo) : task.assignedTo,
      assignedName: updateAssignedTo && selectedMember ? selectedMember.name : task.assignedName,
      dueDate: updateDueDate ? dueDateNano : task.dueDate,
      manualAssignmentDate: updateAssignmentDate ? manualAssignmentDateNano : task.manualAssignmentDate,
      bill: updateBill ? (bill.trim() || undefined) : task.bill,
      advanceReceived: updateAdvanceReceived ? advanceReceivedNat : task.advanceReceived,
      paymentStatus: updatePaymentStatus ? paymentStatus : task.paymentStatus,
    }));

    const taskIds = tasks.map((t) => t.id);

    updateTasks.mutate(
      { taskIds, tasks: updatedTasks },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Edit Tasks</DialogTitle>
          <DialogDescription>Update {tasks.length} selected task(s). Only checked fields will be updated.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="updateStatus" checked={updateStatus} onCheckedChange={(checked) => setUpdateStatus(checked === true)} />
              <Label htmlFor="updateStatus" className="flex-1">
                Update Status
              </Label>
              {updateStatus && (
                <Select value={status} onValueChange={(value: Type__2) => setStatus(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Type__2.pending}>Pending</SelectItem>
                    <SelectItem value={Type__2.inProgress}>In Progress</SelectItem>
                    <SelectItem value={Type__2.completed}>Completed</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="updateComment"
                checked={updateComment}
                onCheckedChange={(checked) => setUpdateComment(checked === true)}
                className="mt-2"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="updateComment">Update Comment</Label>
                {updateComment && (
                  <Textarea
                    id="commentInput"
                    placeholder="Add notes or comments about these tasks..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateTaskType"
                checked={updateTaskType}
                onCheckedChange={(checked) => setUpdateTaskType(checked === true)}
              />
              <Label htmlFor="updateTaskType" className="flex-1">
                Update Task Type
              </Label>
              {updateTaskType && (
                <Select value={taskType} onValueChange={(value: Type__3) => setTaskType(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Type__3.GST}>GST</SelectItem>
                    <SelectItem value={Type__3.Audit}>Audit</SelectItem>
                    <SelectItem value={Type__3.ITNotice}>IT Notice</SelectItem>
                    <SelectItem value={Type__3.TDS}>TDS</SelectItem>
                    <SelectItem value={Type__3.Accounts}>Accounts</SelectItem>
                    <SelectItem value={Type__3.FormFiling}>Form Filing</SelectItem>
                    <SelectItem value={Type__3.CACertificate}>CA Certificate</SelectItem>
                    <SelectItem value={Type__3.Other}>Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateAssignedTo"
                checked={updateAssignedTo}
                onCheckedChange={(checked) => setUpdateAssignedTo(checked === true)}
              />
              <Label htmlFor="updateAssignedTo" className="flex-1">
                Update Assigned To
              </Label>
              {updateAssignedTo && (
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.principal.toString()} value={member.principal.toString()}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="updateDueDate"
                checked={updateDueDate}
                onCheckedChange={(checked) => setUpdateDueDate(checked === true)}
                className="mt-2"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="updateDueDate">Update Due Date</Label>
                {updateDueDate && (
                  <Input
                    id="dueDateInput"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="updateAssignmentDate"
                checked={updateAssignmentDate}
                onCheckedChange={(checked) => setUpdateAssignmentDate(checked === true)}
                className="mt-2"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="updateAssignmentDate">Update Assignment Date</Label>
                {updateAssignmentDate && (
                  <Input
                    id="assignmentDateInput"
                    type="date"
                    value={assignmentDate}
                    onChange={(e) => setAssignmentDate(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="updateBill"
                checked={updateBill}
                onCheckedChange={(checked) => setUpdateBill(checked === true)}
                className="mt-2"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="updateBill">Update Bill Amount</Label>
                {updateBill && (
                  <Input
                    id="billInput"
                    placeholder="e.g., 50000"
                    value={bill}
                    onChange={(e) => setBill(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="updateAdvanceReceived"
                checked={updateAdvanceReceived}
                onCheckedChange={(checked) => setUpdateAdvanceReceived(checked === true)}
                className="mt-2"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="updateAdvanceReceived">Update Advance Received</Label>
                {updateAdvanceReceived && (
                  <Input
                    id="advanceReceivedInput"
                    type="number"
                    placeholder="e.g., 25000"
                    value={advanceReceived}
                    onChange={(e) => setAdvanceReceived(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="updatePaymentStatus"
                checked={updatePaymentStatus}
                onCheckedChange={(checked) => setUpdatePaymentStatus(checked === true)}
              />
              <Label htmlFor="updatePaymentStatus" className="flex-1">
                Update Payment Status
              </Label>
              {updatePaymentStatus && (
                <Select value={paymentStatus} onValueChange={(value: Type) => setPaymentStatus(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Type.pending}>Pending</SelectItem>
                    <SelectItem value={Type.paid}>Paid</SelectItem>
                    <SelectItem value={Type.overdue}>Overdue</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateTasks.isPending || (!updateStatus && !updateComment && !updateTaskType && !updateAssignedTo && !updateDueDate && !updateAssignmentDate && !updateBill && !updateAdvanceReceived && !updatePaymentStatus)}
            >
              {updateTasks.isPending ? 'Updating...' : 'Update Tasks'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
