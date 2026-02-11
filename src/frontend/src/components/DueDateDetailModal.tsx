import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { DueDateDayType, Type__2, Type } from '../backend';
import { useGetDueDateModalData } from '../hooks/useQueries';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DueDateDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardType: DueDateDayType | null;
}

type SortField = 'clientName' | 'taskTitle' | 'assignee' | 'status' | 'paymentStatus' | 'dueDate';
type SortDirection = 'asc' | 'desc' | null;

export default function DueDateDetailModal({ open, onOpenChange, cardType }: DueDateDetailModalProps) {
  const { data, isLoading } = useGetDueDateModalData(cardType);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const getTitle = () => {
    if (!cardType) return '';
    switch (cardType.__kind__) {
      case 'dueToday':
        return 'Tasks Due Today';
      case 'dueTomorrow':
        return 'Tasks Due Tomorrow';
      default:
        return 'Due Date Details';
    }
  };

  const getDescription = () => {
    if (!cardType) return '';
    switch (cardType.__kind__) {
      case 'dueToday':
        return 'All tasks with due date matching today';
      case 'dueTomorrow':
        return 'All tasks with due date matching tomorrow';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: Type__2): string => {
    switch (status) {
      case Type__2.pending:
        return 'Pending';
      case Type__2.inProgress:
        return 'In Progress';
      case Type__2.completed:
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const getStatusVariant = (status: Type__2): 'outline' | 'default' | 'secondary' => {
    switch (status) {
      case Type__2.pending:
        return 'outline';
      case Type__2.inProgress:
        return 'default';
      case Type__2.completed:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPaymentStatusLabel = (status: Type): string => {
    switch (status) {
      case Type.pending:
        return 'Pending';
      case Type.paid:
        return 'Paid';
      case Type.overdue:
        return 'Overdue';
      default:
        return 'Unknown';
    }
  };

  const getPaymentStatusVariant = (status: Type): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case Type.pending:
        return 'default';
      case Type.paid:
        return 'secondary';
      case Type.overdue:
        return 'destructive';
      default:
        return 'default';
    }
  };

  const formatDate = (timestamp: bigint | undefined): string => {
    if (!timestamp) return '-';
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedItems = useMemo(() => {
    if (!data?.items || !sortField || !sortDirection) return data?.items || [];

    const sorted = [...data.items].sort((a, b) => {
      let aValue: string | number | bigint = '';
      let bValue: string | number | bigint = '';

      switch (sortField) {
        case 'clientName':
          aValue = a.clientName.toLowerCase();
          bValue = b.clientName.toLowerCase();
          break;
        case 'taskTitle':
          aValue = a.taskTitle.toLowerCase();
          bValue = b.taskTitle.toLowerCase();
          break;
        case 'assignee':
          aValue = a.assignee.toLowerCase();
          bValue = b.assignee.toLowerCase();
          break;
        case 'status':
          aValue = getStatusLabel(a.status).toLowerCase();
          bValue = getStatusLabel(b.status).toLowerCase();
          break;
        case 'paymentStatus':
          aValue = getPaymentStatusLabel(a.paymentStatus).toLowerCase();
          bValue = getPaymentStatusLabel(b.paymentStatus).toLowerCase();
          break;
        case 'dueDate':
          aValue = a.dueDate ? Number(a.dueDate) : 0;
          bValue = b.dueDate ? Number(b.dueDate) : 0;
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
      }
    });

    return sorted;
  }, [data?.items, sortField, sortDirection]);

  const handleExport = () => {
    if (!data?.items || data.items.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      const headers = ['Client Name', 'Task Title', 'Assignee', 'Status', 'Payment Status', 'Due Date', 'Comments'];
      const rows = sortedItems.map((item) => [
        item.clientName,
        item.taskTitle,
        item.assignee,
        getStatusLabel(item.status),
        getPaymentStatusLabel(item.paymentStatus),
        formatDate(item.dueDate),
        item.comments || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row
            .map((cell) => {
              const cellStr = String(cell);
              if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }
              return cellStr;
            })
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `due_date_tasks_${cardType?.__kind__ || 'unknown'}_${dateStr}.csv`;

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success('Due date tasks exported successfully');
    } catch (error) {
      toast.error('Failed to export: ' + (error as Error).message);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">{getTitle()}</DialogTitle>
              <DialogDescription className="mt-1">{getDescription()}</DialogDescription>
            </div>
            <Button onClick={handleExport} disabled={!data?.items || data.items.length === 0} size="sm" className="ml-4">
              <FileDown className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="text-muted-foreground">Loading details...</p>
              </div>
            </div>
          ) : !data?.items || data.items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">No tasks found for this date.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold text-foreground">{Number(data.taskCount)}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{sortedItems.length} task(s) displayed</p>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 font-semibold hover:bg-transparent"
                          onClick={() => handleSort('clientName')}
                        >
                          Client Name
                          {getSortIcon('clientName')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 font-semibold hover:bg-transparent"
                          onClick={() => handleSort('taskTitle')}
                        >
                          Task Title
                          {getSortIcon('taskTitle')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 font-semibold hover:bg-transparent"
                          onClick={() => handleSort('assignee')}
                        >
                          Assignee
                          {getSortIcon('assignee')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 font-semibold hover:bg-transparent"
                          onClick={() => handleSort('status')}
                        >
                          Status
                          {getSortIcon('status')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 font-semibold hover:bg-transparent"
                          onClick={() => handleSort('paymentStatus')}
                        >
                          Payment Status
                          {getSortIcon('paymentStatus')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 font-semibold hover:bg-transparent"
                          onClick={() => handleSort('dueDate')}
                        >
                          Due Date
                          {getSortIcon('dueDate')}
                        </Button>
                      </TableHead>
                      <TableHead>Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedItems.map((item, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.clientName}</TableCell>
                        <TableCell>{item.taskTitle}</TableCell>
                        <TableCell>{item.assignee}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(item.status)}>
                            {getStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPaymentStatusVariant(item.paymentStatus)}>
                            {getPaymentStatusLabel(item.paymentStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{formatDate(item.dueDate)}</TableCell>
                        <TableCell className="max-w-xs truncate" title={item.comments || ''}>
                          {item.comments || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
