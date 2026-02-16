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
import CaptainsMultiSelect from './CaptainsMultiSelect';
import { toast } from 'sonner';
import { getTaskStatusOptions } from '../utils/taskStatus';

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
  const [updateSubType, setUpdateSubType] = useState(false);
  const [subType, setSubType] = useState('');
  const [updateAssignedTo, setUpdateAssignedTo] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [updateCaptains, setUpdateCaptains] = useState(false);
  const [captains, setCaptains] = useState<string[]>([]);
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

  const statusOptions = getTaskStatusOptions();

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
    const advanceReceivedNat = updateAdvanceReceived && advanceReceived 
      ? BigInt(Math.floor(parseFloat(advanceReceived))) 
      : undefined;

    // Convert captains to Principal array
    const captainsPrincipals = updateCaptains ? captains.map((c) => Principal.fromText(c)) : [];

    const updatedTasks = tasks.map((task) => ({
      ...task,
      status: updateStatus ? status : task.status,
      comment: updateComment ? (comment.trim() || undefined) : task.comment,
      taskType: updateTaskType ? taskType : task.taskType,
      subType: updateSubType ? (subType.trim() || undefined) : task.subType,
      assignedTo: updateAssignedTo && selectedMember ? Principal.fromText(assignedTo) : task.assignedTo,
      assignedName: updateAssignedTo && selectedMember ? selectedMember.name : task.assignedName,
      captains: updateCaptains ? captainsPrincipals : task.captains,
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
          // Reset form
          setUpdateStatus(false);
          setUpdateComment(false);
          setUpdateTaskType(false);
          setUpdateSubType(false);
          setUpdateAssignedTo(false);
          setUpdateCaptains(false);
          setCaptains([]);
          setUpdateDueDate(false);
          setUpdateAssignmentDate(false);
          setUpdateBill(false);
          setUpdateAdvanceReceived(false);
          setUpdatePaymentStatus(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Edit Tasks</DialogTitle>
          <DialogDescription>
            Editing {tasks.length} task{tasks.length !== 1 ? 's' : ''}. Select fields to update.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateStatus"
                checked={updateStatus}
                onCheckedChange={(checked) => setUpdateStatus(checked as boolean)}
              />
              <Label htmlFor="updateStatus" className="font-medium cursor-pointer">
                Update Status
              </Label>
            </div>
            {updateStatus && (
              <Select value={status} onValueChange={(value: Type__2) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateTaskType"
                checked={updateTaskType}
                onCheckedChange={(checked) => setUpdateTaskType(checked as boolean)}
              />
              <Label htmlFor="updateTaskType" className="font-medium cursor-pointer">
                Update Task Type
              </Label>
            </div>
            {updateTaskType && (
              <Select value={taskType} onValueChange={(value: Type__3) => setTaskType(value)}>
                <SelectTrigger>
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

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateSubType"
                checked={updateSubType}
                onCheckedChange={(checked) => setUpdateSubType(checked as boolean)}
              />
              <Label htmlFor="updateSubType" className="font-medium cursor-pointer">
                Update Task Subtype
              </Label>
            </div>
            {updateSubType && (
              <Input
                placeholder="e.g., TDS Return Filing"
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateAssignedTo"
                checked={updateAssignedTo}
                onCheckedChange={(checked) => setUpdateAssignedTo(checked as boolean)}
              />
              <Label htmlFor="updateAssignedTo" className="font-medium cursor-pointer">
                Update Assignee
              </Label>
            </div>
            {updateAssignedTo && (
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
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

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateCaptains"
                checked={updateCaptains}
                onCheckedChange={(checked) => setUpdateCaptains(checked as boolean)}
              />
              <Label htmlFor="updateCaptains" className="font-medium cursor-pointer">
                Update Captains
              </Label>
            </div>
            {updateCaptains && (
              <CaptainsMultiSelect
                teamMembers={teamMembers}
                value={captains}
                onValueChange={setCaptains}
                placeholder="Select captains..."
              />
            )}
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateDueDate"
                checked={updateDueDate}
                onCheckedChange={(checked) => setUpdateDueDate(checked as boolean)}
              />
              <Label htmlFor="updateDueDate" className="font-medium cursor-pointer">
                Update Due Date
              </Label>
            </div>
            {updateDueDate && (
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateAssignmentDate"
                checked={updateAssignmentDate}
                onCheckedChange={(checked) => setUpdateAssignmentDate(checked as boolean)}
              />
              <Label htmlFor="updateAssignmentDate" className="font-medium cursor-pointer">
                Update Assignment Date
              </Label>
            </div>
            {updateAssignmentDate && (
              <Input
                type="date"
                value={assignmentDate}
                onChange={(e) => setAssignmentDate(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateBill"
                checked={updateBill}
                onCheckedChange={(checked) => setUpdateBill(checked as boolean)}
              />
              <Label htmlFor="updateBill" className="font-medium cursor-pointer">
                Update Bill Amount
              </Label>
            </div>
            {updateBill && (
              <Input
                placeholder="e.g., 50000"
                value={bill}
                onChange={(e) => setBill(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateAdvanceReceived"
                checked={updateAdvanceReceived}
                onCheckedChange={(checked) => setUpdateAdvanceReceived(checked as boolean)}
              />
              <Label htmlFor="updateAdvanceReceived" className="font-medium cursor-pointer">
                Update Advance Received
              </Label>
            </div>
            {updateAdvanceReceived && (
              <Input
                type="number"
                placeholder="e.g., 25000"
                value={advanceReceived}
                onChange={(e) => setAdvanceReceived(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updatePaymentStatus"
                checked={updatePaymentStatus}
                onCheckedChange={(checked) => setUpdatePaymentStatus(checked as boolean)}
              />
              <Label htmlFor="updatePaymentStatus" className="font-medium cursor-pointer">
                Update Payment Status
              </Label>
            </div>
            {updatePaymentStatus && (
              <Select value={paymentStatus} onValueChange={(value: Type) => setPaymentStatus(value)}>
                <SelectTrigger>
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

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateComment"
                checked={updateComment}
                onCheckedChange={(checked) => setUpdateComment(checked as boolean)}
              />
              <Label htmlFor="updateComment" className="font-medium cursor-pointer">
                Update Comment
              </Label>
            </div>
            {updateComment && (
              <Textarea
                placeholder="Add notes or comments..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateTasks.isPending}>
              {updateTasks.isPending ? 'Updating...' : `Update ${tasks.length} Task${tasks.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
