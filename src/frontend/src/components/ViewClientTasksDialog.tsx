import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetTasks } from '../hooks/useQueries';
import type { Type, Type__2, Type__3 } from '../backend';

interface ViewClientTasksDialogProps {
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ViewClientTasksDialog({ clientName, open, onOpenChange }: ViewClientTasksDialogProps) {
  const { data: allTasks = [] } = useGetTasks();

  const clientTasks = allTasks.filter(
    (task) => task.clientName.toLowerCase() === clientName.toLowerCase()
  );

  const getStatusBadge = (status: Type__2) => {
    const variants: Record<Type__2, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      inProgress: 'default',
      completed: 'default',
      docsPending: 'secondary',
      hold: 'destructive',
    };
    const labels: Record<Type__2, string> = {
      pending: 'Pending',
      inProgress: 'In Progress',
      completed: 'Completed',
      docsPending: 'Docs Pending',
      hold: 'Hold',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getPaymentStatusBadge = (status: Type) => {
    const variants: Record<Type, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      paid: 'default',
      overdue: 'destructive',
    };
    const labels: Record<Type, string> = {
      pending: 'Pending',
      paid: 'Paid',
      overdue: 'Overdue',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getTaskTypeLabel = (taskType: Type__3): string => {
    const labels: Record<Type__3, string> = {
      GST: 'GST',
      Audit: 'Audit',
      ITNotice: 'IT Notice',
      TDS: 'TDS',
      Accounts: 'Accounts',
      FormFiling: 'Form Filing',
      CACertificate: 'CA Certificate',
      Other: 'Other',
    };
    return labels[taskType];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tasks for {clientName}</DialogTitle>
        </DialogHeader>
        {clientTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No tasks found for this client</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTaskTypeLabel(task.taskType)}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>{task.assignedName}</TableCell>
                    <TableCell>
                      {task.dueDate
                        ? new Date(Number(task.dueDate) / 1000000).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell>{getPaymentStatusBadge(task.paymentStatus)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
