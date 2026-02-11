import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateTask, useGetClients, useGetAllTeamMembers } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { Task } from '../backend';
import { Type, Type__2, Type__3 } from '../backend';
import { Principal } from '@dfinity/principal';
import SearchableAssigneeSelect from './SearchableAssigneeSelect';
import { toast } from 'sonner';

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditTaskDialog({ task, open, onOpenChange }: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [clientName, setClientName] = useState(task.clientName);
  const [taskType, setTaskType] = useState<Type__3>(task.taskType);
  const [subType, setSubType] = useState(task.subType || '');
  const [status, setStatus] = useState<Type__2>(task.status);
  const [assignedTo, setAssignedTo] = useState(task.assignedTo.toString());
  const [dueDate, setDueDate] = useState('');
  const [assignmentDate, setAssignmentDate] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [bill, setBill] = useState(task.bill || '');
  const [advanceReceived, setAdvanceReceived] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<Type>(task.paymentStatus);
  const [comment, setComment] = useState(task.comment || '');
  const updateTask = useUpdateTask();
  const { data: clients = [] } = useGetClients();
  const { data: teamMembers = [] } = useGetAllTeamMembers();
  const { identity } = useInternetIdentity();

  useEffect(() => {
    setTitle(task.title);
    setClientName(task.clientName);
    setTaskType(task.taskType);
    setSubType(task.subType || '');
    setStatus(task.status);
    setAssignedTo(task.assignedTo.toString());
    setBill(task.bill || '');
    setAdvanceReceived(task.advanceReceived ? task.advanceReceived.toString() : '');
    setPaymentStatus(task.paymentStatus);
    setComment(task.comment || '');
    
    // Convert nanoseconds timestamp to date string with validation for due date
    if (task.dueDate) {
      try {
        const timestamp = Number(task.dueDate) / 1000000;
        if (!isNaN(timestamp)) {
          const dateObj = new Date(timestamp);
          if (!isNaN(dateObj.getTime())) {
            const dateStr = dateObj.toISOString().split('T')[0];
            setDueDate(dateStr);
          } else {
            setDueDate('');
          }
        } else {
          setDueDate('');
        }
      } catch (error) {
        console.error('Error converting due date:', error);
        setDueDate('');
      }
    } else {
      setDueDate('');
    }

    // Convert nanoseconds timestamp to date string with validation for manual assignment date
    // Prioritize manualAssignmentDate over assignmentDate
    const dateToUse = task.manualAssignmentDate || task.assignmentDate;
    if (dateToUse) {
      try {
        const timestamp = Number(dateToUse) / 1000000;
        if (!isNaN(timestamp)) {
          const dateObj = new Date(timestamp);
          if (!isNaN(dateObj.getTime())) {
            const dateStr = dateObj.toISOString().split('T')[0];
            setAssignmentDate(dateStr);
          } else {
            setAssignmentDate('');
          }
        } else {
          setAssignmentDate('');
        }
      } catch (error) {
        console.error('Error converting assignment date:', error);
        setAssignmentDate('');
      }
    } else {
      setAssignmentDate('');
    }

    // Convert nanoseconds timestamp to date string with validation for completion date
    if (task.completionDate) {
      try {
        const timestamp = Number(task.completionDate) / 1000000;
        if (!isNaN(timestamp)) {
          const dateObj = new Date(timestamp);
          if (!isNaN(dateObj.getTime())) {
            const dateStr = dateObj.toISOString().split('T')[0];
            setCompletionDate(dateStr);
          } else {
            setCompletionDate('');
          }
        } else {
          setCompletionDate('');
        }
      } catch (error) {
        console.error('Error converting completion date:', error);
        setCompletionDate('');
      }
    } else {
      setCompletionDate('');
    }
  }, [task]);

  // Check if current user can edit the comment
  const canEditComment = identity && task.assignedTo.toString() === identity.getPrincipal().toString();

  // Calculate outstanding amount
  const calculateOutstanding = (): number => {
    const billAmount = parseFloat(bill.replace(/[^0-9.]/g, '')) || 0;
    const advance = parseFloat(advanceReceived) || 0;
    return Math.max(0, billAmount - advance);
  };

  const outstandingAmount = calculateOutstanding();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && clientName && assignedTo) {
      const selectedMember = teamMembers.find((m) => m.principal.toString() === assignedTo);
      const assignedName = selectedMember?.name || task.assignedName;

      // Convert due date string to nanoseconds timestamp with validation
      let dueDateNano: bigint | undefined = undefined;
      if (dueDate && dueDate.trim() !== '') {
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
      if (assignmentDate && assignmentDate.trim() !== '') {
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
      const advanceReceivedNat = advanceReceived ? BigInt(Math.floor(parseFloat(advanceReceived))) : undefined;

      updateTask.mutate(
        {
          taskId: task.id,
          task: {
            id: task.id,
            clientId: task.clientId,
            title: title.trim(),
            clientName: clientName,
            taskType: taskType,
            status: status,
            assignedTo: Principal.fromText(assignedTo),
            assignedName: assignedName,
            createdAt: task.createdAt,
            recurring: task.recurring,
            subType: subType.trim() || undefined,
            dueDate: dueDateNano,
            manualAssignmentDate: manualAssignmentDateNano,
            bill: bill.trim() || undefined,
            advanceReceived: advanceReceivedNat,
            paymentStatus: paymentStatus,
            comment: comment.trim() || undefined,
          },
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input id="title" placeholder="Enter task title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select value={clientName} onValueChange={setClientName} required>
              <SelectTrigger id="client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.name}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="taskType">Task Type</Label>
            <Select value={taskType} onValueChange={(value: Type__3) => setTaskType(value)}>
              <SelectTrigger id="taskType">
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="subType">Sub Type (Optional)</Label>
            <Input
              id="subType"
              placeholder="e.g., TDS Return Filing"
              value={subType}
              onChange={(e) => setSubType(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: Type__2) => setStatus(value)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Type__2.pending}>Pending</SelectItem>
                <SelectItem value={Type__2.inProgress}>In Progress</SelectItem>
                <SelectItem value={Type__2.completed}>Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignmentDate">Assignment Date (Optional)</Label>
            <Input
              id="assignmentDate"
              type="date"
              value={assignmentDate}
              onChange={(e) => setAssignmentDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Manually adjust the assignment date if needed
            </p>
          </div>
          {completionDate && (
            <div className="space-y-2">
              <Label htmlFor="completionDate">Completion Date</Label>
              <Input
                id="completionDate"
                type="date"
                value={completionDate}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Automatically set when task status changed to Completed
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="bill">Bill Amount (Optional)</Label>
            <Input
              id="bill"
              placeholder="e.g., 50000"
              value={bill}
              onChange={(e) => setBill(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="advanceReceived">Advance Received (Optional)</Label>
            <Input
              id="advanceReceived"
              type="number"
              placeholder="e.g., 25000"
              value={advanceReceived}
              onChange={(e) => setAdvanceReceived(e.target.value)}
            />
          </div>
          {(bill || advanceReceived) && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">Outstanding Balance</div>
              <div className="text-2xl font-bold text-foreground">₹{outstandingAmount.toLocaleString()}</div>
              {outstandingAmount === 0 && paymentStatus === Type.paid && (
                <p className="text-xs text-green-600 mt-1">✓ Payment Complete</p>
              )}
              {outstandingAmount > 0 && (
                <p className="text-xs text-amber-600 mt-1">Partial payment received</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="paymentStatus">Payment Status</Label>
            <Select value={paymentStatus} onValueChange={(value: Type) => setPaymentStatus(value)}>
              <SelectTrigger id="paymentStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Type.pending}>Pending</SelectItem>
                <SelectItem value={Type.paid}>Paid</SelectItem>
                <SelectItem value={Type.overdue}>Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign To</Label>
            <SearchableAssigneeSelect
              teamMembers={teamMembers}
              value={assignedTo}
              onValueChange={setAssignedTo}
              placeholder="Select team member"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Add notes or comments about this task..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              disabled={!canEditComment}
            />
            {!canEditComment && (
              <p className="text-xs text-muted-foreground">
                Only the assigned user or admin can edit comments
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateTask.isPending}>
              {updateTask.isPending ? 'Updating...' : 'Update Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
