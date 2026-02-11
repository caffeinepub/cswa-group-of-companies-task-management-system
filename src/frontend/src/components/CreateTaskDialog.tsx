import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTask, useGetClients, useGetAllTeamMembers } from '../hooks/useQueries';
import { Type, Type__1, Type__2, Type__3 } from '../backend';
import { Principal } from '@dfinity/principal';
import SearchableAssigneeSelect from './SearchableAssigneeSelect';
import { toast } from 'sonner';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialClientName?: string;
}

export default function CreateTaskDialog({ open, onOpenChange, initialClientName }: CreateTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [taskType, setTaskType] = useState<Type__3>(Type__3.GST);
  const [subType, setSubType] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignmentDate, setAssignmentDate] = useState('');
  const [bill, setBill] = useState('');
  const [advanceReceived, setAdvanceReceived] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<Type>(Type.pending);
  const [comment, setComment] = useState('');
  const createTask = useCreateTask();
  const { data: clients = [] } = useGetClients();
  const { data: teamMembers = [] } = useGetAllTeamMembers();

  // Apply initial client name when dialog opens or when initialClientName changes
  useEffect(() => {
    if (open && initialClientName) {
      setClientName(initialClientName);
    }
  }, [open, initialClientName]);

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
      const assignedName = selectedMember?.name || '';

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

      createTask.mutate(
        {
          id: 0,
          clientId: 0,
          title: title.trim(),
          clientName: clientName,
          taskType: taskType,
          status: Type__2.pending,
          assignedTo: Principal.fromText(assignedTo),
          assignedName: assignedName,
          createdAt: BigInt(Date.now()) * BigInt(1000000),
          recurring: Type__1.none,
          subType: subType.trim() || undefined,
          dueDate: dueDateNano,
          manualAssignmentDate: manualAssignmentDateNano,
          bill: bill.trim() || undefined,
          advanceReceived: advanceReceivedNat,
          paymentStatus: paymentStatus,
          comment: comment.trim() || undefined,
        },
        {
          onSuccess: () => {
            setTitle('');
            setClientName('');
            setTaskType(Type__3.GST);
            setSubType('');
            setAssignedTo('');
            setDueDate('');
            setAssignmentDate('');
            setBill('');
            setAdvanceReceived('');
            setPaymentStatus(Type.pending);
            setComment('');
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
          <DialogTitle>Create New Task</DialogTitle>
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
              If not specified, the current date will be used automatically
            </p>
          </div>
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
            <Label htmlFor="assignedTo">Assigned To</Label>
            <SearchableAssigneeSelect
              teamMembers={teamMembers}
              value={assignedTo}
              onValueChange={setAssignedTo}
              placeholder="Search and select assignee..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Add any additional notes..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
