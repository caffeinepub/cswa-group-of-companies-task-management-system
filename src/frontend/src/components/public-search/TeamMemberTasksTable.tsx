import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { PublicTaskByAssignee, Type, Type__2, Type__3 } from '../../backend';
import { formatDate, formatOptionalText } from '../../utils/formatters';
import { exportPublicSearchTasksByAssigneeToExcel } from '../../lib/excelTemplates';
import { compareTaskStatus } from '../../utils/taskStatus';

interface TeamMemberTasksTableProps {
  tasks: PublicTaskByAssignee[];
}

type SortColumn = 'title' | 'clientName' | 'status' | 'paymentStatus' | 'assignedDate' | 'dueDate' | 'completionDate' | 'taskSubType';
type SortDirection = 'asc' | 'desc' | null;

export default function TeamMemberTasksTable({ tasks }: TeamMemberTasksTableProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [exportError, setExportError] = useState<string | null>(null);

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

  const getTaskKey = (task: PublicTaskByAssignee) => {
    return `${task.title}-${task.clientName}-${task.assignedName}`;
  };

  // Sort tasks
  const sortedTasks = useMemo(() => {
    if (!sortColumn || !sortDirection) return tasks;

    const sorted = [...tasks].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortColumn) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'clientName':
          aVal = a.clientName.toLowerCase();
          bVal = b.clientName.toLowerCase();
          break;
        case 'status':
          return compareTaskStatus(a.status, b.status, sortDirection);
        case 'paymentStatus':
          aVal = a.paymentStatus;
          bVal = b.paymentStatus;
          break;
        case 'assignedDate':
          aVal = a.assignedDate ? Number(a.assignedDate) : 0;
          bVal = b.assignedDate ? Number(b.assignedDate) : 0;
          break;
        case 'dueDate':
          aVal = a.dueDate ? Number(a.dueDate) : 0;
          bVal = b.dueDate ? Number(b.dueDate) : 0;
          break;
        case 'completionDate':
          aVal = a.completionDate ? Number(a.completionDate) : 0;
          bVal = b.completionDate ? Number(b.completionDate) : 0;
          break;
        case 'taskSubType':
          aVal = getTaskTypeLabel(a.taskSubType).toLowerCase();
          bVal = getTaskTypeLabel(b.taskSubType).toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [tasks, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1 inline" />;
    }
    return <ArrowDown className="h-4 w-4 ml-1 inline" />;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = new Set(tasks.map(getTaskKey));
      setSelectedTasks(allKeys);
    } else {
      setSelectedTasks(new Set());
    }
  };

  const handleSelectTask = (taskKey: string, checked: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(taskKey);
      } else {
        newSet.delete(taskKey);
      }
      return newSet;
    });
  };

  const handleExportSelected = () => {
    try {
      setExportError(null);
      if (selectedTasks.size === 0) {
        setExportError('Please select at least one task to export');
        return;
      }

      const selectedTasksData = tasks.filter(task => selectedTasks.has(getTaskKey(task)));
      exportPublicSearchTasksByAssigneeToExcel(selectedTasksData);
      setSelectedTasks(new Set());
    } catch (error) {
      setExportError(`Failed to export: ${(error as Error).message}`);
    }
  };

  const allSelected = tasks.length > 0 && selectedTasks.size === tasks.length;
  const someSelected = selectedTasks.size > 0 && selectedTasks.size < tasks.length;

  if (tasks.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No tasks found</div>;
  }

  return (
    <div className="space-y-4">
      {exportError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Export Error</AlertTitle>
          <AlertDescription>{exportError}</AlertDescription>
        </Alert>
      )}

      {selectedTasks.size > 0 && (
        <div className="flex items-center justify-between bg-muted p-4 rounded-md">
          <span className="text-sm font-medium">
            {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
          </span>
          <Button onClick={handleExportSelected} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Selected
          </Button>
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all tasks"
                  className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                />
              </TableHead>
              <TableHead 
                className="w-[200px] cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('title')}
              >
                Task Title {getSortIcon('title')}
              </TableHead>
              <TableHead 
                className="w-[150px] cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('clientName')}
              >
                Client {getSortIcon('clientName')}
              </TableHead>
              <TableHead 
                className="w-[120px] cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('taskSubType')}
              >
                Task Sub Type {getSortIcon('taskSubType')}
              </TableHead>
              <TableHead 
                className="w-[120px] cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('status')}
              >
                Status {getSortIcon('status')}
              </TableHead>
              <TableHead 
                className="w-[120px] cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('paymentStatus')}
              >
                Payment {getSortIcon('paymentStatus')}
              </TableHead>
              <TableHead 
                className="w-[120px] cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('assignedDate')}
              >
                Assigned Date {getSortIcon('assignedDate')}
              </TableHead>
              <TableHead 
                className="w-[120px] cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('dueDate')}
              >
                Due Date {getSortIcon('dueDate')}
              </TableHead>
              <TableHead 
                className="w-[140px] cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('completionDate')}
              >
                Completion Date {getSortIcon('completionDate')}
              </TableHead>
              <TableHead className="w-[200px]">Comment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.map((task) => {
              const taskKey = getTaskKey(task);
              return (
                <TableRow key={taskKey}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTasks.has(taskKey)}
                      onCheckedChange={(checked) => handleSelectTask(taskKey, checked as boolean)}
                      aria-label={`Select ${task.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>{task.clientName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getTaskTypeLabel(task.taskSubType)}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>{getPaymentStatusBadge(task.paymentStatus)}</TableCell>
                  <TableCell>{formatDate(task.assignedDate)}</TableCell>
                  <TableCell>{formatDate(task.dueDate)}</TableCell>
                  <TableCell>{formatDate(task.completionDate)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground truncate max-w-[180px] block">
                      {formatOptionalText(task.comment)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
