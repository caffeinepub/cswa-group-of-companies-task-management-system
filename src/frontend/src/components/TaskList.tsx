import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Task } from '../backend';
import { Type, Type__2 } from '../backend';
import EditTaskDialog from './EditTaskDialog';
import ViewClientTasksDialog from './ViewClientTasksDialog';
import { useDeleteTask, useUpdateTaskComment, useIsCallerAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { compareTaskStatus } from '../utils/taskStatus';

interface TaskListProps {
  tasks: Task[];
  onSelectionChange?: (selectedIds: Set<number>) => void;
  showCompletedColumn?: boolean;
}

type SortColumn = 'dueDate' | 'completionDate' | 'clientName' | 'subType' | 'status';
type SortDirection = 'asc' | 'desc' | null;

export default function TaskList({ tasks, onSelectionChange, showCompletedColumn = false }: TaskListProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingClientName, setViewingClientName] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const deleteTask = useDeleteTask();
  const updateComment = useUpdateTaskComment();
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();

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

  const handleDeleteClick = (taskId: number) => {
    setDeletingTaskId(taskId);
  };

  const handleDeleteConfirm = () => {
    if (deletingTaskId !== null) {
      deleteTask.mutate(deletingTaskId, {
        onSuccess: () => {
          setDeletingTaskId(null);
        },
      });
    }
  };

  const handleEditComment = (task: Task) => {
    setEditingCommentId(task.id);
    setCommentText(task.comment || '');
  };

  const handleSaveComment = (taskId: number) => {
    updateComment.mutate(
      { taskId, comment: commentText.trim() || null },
      {
        onSuccess: () => {
          setEditingCommentId(null);
        },
      }
    );
  };

  const handleCancelComment = () => {
    setEditingCommentId(null);
    setCommentText('');
  };

  const canEditComment = (task: Task): boolean => {
    if (!identity) return false;
    const userPrincipal = identity.getPrincipal().toString();
    return task.assignedTo.toString() === userPrincipal || isAdmin === true;
  };

  const canDeleteTask = (task: Task): boolean => {
    if (!identity) return false;
    const userPrincipal = identity.getPrincipal().toString();
    return task.assignedTo.toString() === userPrincipal || isAdmin === true;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(tasks.map(t => t.id));
      setSelectedTasks(allIds);
      onSelectionChange?.(allIds);
    } else {
      setSelectedTasks(new Set());
      onSelectionChange?.(new Set());
    }
  };

  const handleSelectTask = (taskId: number, checked: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      onSelectionChange?.(newSet);
      return newSet;
    });
  };

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

  const sortedTasks = useMemo(() => {
    if (!sortColumn || !sortDirection) return tasks;

    return [...tasks].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortColumn) {
        case 'dueDate':
          aVal = a.dueDate ? Number(a.dueDate) : 0;
          bVal = b.dueDate ? Number(b.dueDate) : 0;
          break;
        case 'completionDate':
          aVal = a.completionDate ? Number(a.completionDate) : 0;
          bVal = b.completionDate ? Number(b.completionDate) : 0;
          break;
        case 'clientName':
          aVal = a.clientName.toLowerCase();
          bVal = b.clientName.toLowerCase();
          break;
        case 'subType':
          aVal = (a.subType || '').toLowerCase();
          bVal = (b.subType || '').toLowerCase();
          break;
        case 'status':
          return compareTaskStatus(a.status, b.status, sortDirection);
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tasks, sortColumn, sortDirection]);

  const allSelected = tasks.length > 0 && selectedTasks.size === tasks.length;
  const someSelected = selectedTasks.size > 0 && selectedTasks.size < tasks.length;

  const formatDate = (timestamp?: bigint) => {
    if (!timestamp) return '—';
    try {
      const date = new Date(Number(timestamp) / 1000000);
      return date.toLocaleDateString();
    } catch {
      return '—';
    }
  };

  return (
    <>
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
              <TableHead className="w-[200px]">Task Title</TableHead>
              <TableHead 
                className="w-[150px] cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('clientName')}
              >
                Client {getSortIcon('clientName')}
              </TableHead>
              <TableHead 
                className="w-[120px] cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('subType')}
              >
                Task Subtype {getSortIcon('subType')}
              </TableHead>
              <TableHead 
                className="w-[120px] cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('status')}
              >
                Status {getSortIcon('status')}
              </TableHead>
              <TableHead className="w-[120px]">Payment</TableHead>
              <TableHead 
                className="w-[120px] cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('dueDate')}
              >
                Due Date {getSortIcon('dueDate')}
              </TableHead>
              {showCompletedColumn && (
                <TableHead 
                  className="w-[140px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('completionDate')}
                >
                  Completed {getSortIcon('completionDate')}
                </TableHead>
              )}
              <TableHead className="w-[200px]">Comment</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showCompletedColumn ? 10 : 9} className="text-center py-8 text-muted-foreground">
                  No tasks found
                </TableCell>
              </TableRow>
            ) : (
              sortedTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTasks.has(task.id)}
                      onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
                      aria-label={`Select ${task.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      className="p-0 h-auto font-normal text-primary hover:underline"
                      onClick={() => setViewingClientName(task.clientName)}
                    >
                      {task.clientName}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {task.subType ? (
                      <Badge variant="outline">{task.subType}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>{getPaymentStatusBadge(task.paymentStatus)}</TableCell>
                  <TableCell>{formatDate(task.dueDate)}</TableCell>
                  {showCompletedColumn && (
                    <TableCell>{formatDate(task.completionDate)}</TableCell>
                  )}
                  <TableCell>
                    {editingCommentId === task.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveComment(task.id)} disabled={updateComment.isPending}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelComment}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {task.comment || '—'}
                        </span>
                        {canEditComment(task) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditComment(task)}
                            className="h-6 w-6 p-0"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingTask(task)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {canDeleteTask(task) && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(task.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
        />
      )}

      {viewingClientName && (
        <ViewClientTasksDialog
          clientName={viewingClientName}
          open={!!viewingClientName}
          onOpenChange={(open) => !open && setViewingClientName(null)}
        />
      )}

      <AlertDialog open={deletingTaskId !== null} onOpenChange={(open) => !open && setDeletingTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteTask.isPending}>
              {deleteTask.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
