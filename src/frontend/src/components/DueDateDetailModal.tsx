import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { DueDateDayType, DueDateModalResponse, Type, Type__2 } from '../backend';
import { useGetDueDateModalData } from '../hooks/useQueries';
import { exportTasksToExcel } from '../lib/excelTemplates';
import { Principal } from '@dfinity/principal';

interface DueDateDetailModalProps {
  dayType: DueDateDayType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DueDateDetailModal({ dayType, open, onOpenChange }: DueDateDetailModalProps) {
  const { data: modalData, isLoading } = useGetDueDateModalData(dayType);

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

  const getTitle = () => {
    if (dayType.__kind__ === 'dueToday') return 'Tasks Due Today';
    if (dayType.__kind__ === 'dueTomorrow') return 'Tasks Due Tomorrow';
    if (dayType.__kind__ === 'anyDate') return 'All Tasks with Due Dates';
    if (dayType.__kind__ === 'customDate') {
      const date = new Date(Number(dayType.customDate) / 1000000);
      return `Tasks Due on ${date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })}`;
    }
    return 'Tasks';
  };

  const handleExport = () => {
    if (!modalData || modalData.items.length === 0) return;
    
    const tasksForExport = modalData.items.map((item) => ({
      id: 0,
      clientId: 0,
      clientName: item.clientName,
      title: item.taskTitle,
      taskType: 'Other' as any,
      status: item.status,
      comment: item.comments,
      assignedTo: Principal.anonymous(),
      assignedName: item.assignee,
      captains: [],
      createdAt: BigInt(0),
      recurring: 'none' as any,
      subType: undefined,
      bill: undefined,
      paymentStatus: item.paymentStatus,
      dueDate: item.dueDate,
      assignmentDate: undefined,
      completionDate: undefined,
      manualAssignmentDate: undefined,
      advanceReceived: undefined,
      outstandingAmount: undefined,
    }));
    
    exportTasksToExcel(tasksForExport);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{getTitle()}</span>
            {modalData && modalData.items.length > 0 && (
              <Button onClick={handleExport} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : !modalData || modalData.items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No tasks found</div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Total: {Number(modalData.taskCount)} task{Number(modalData.taskCount) !== 1 ? 's' : ''}
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Comments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modalData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.clientName}</TableCell>
                      <TableCell>{item.taskTitle}</TableCell>
                      <TableCell>{item.assignee}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(item.paymentStatus)}</TableCell>
                      <TableCell>
                        {item.dueDate
                          ? new Date(Number(item.dueDate) / 1000000).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          : '—'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{item.comments || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
