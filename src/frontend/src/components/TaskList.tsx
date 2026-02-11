import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreHorizontal, Pencil, Trash2, MessageSquare, ArrowUpDown, ArrowUp, ArrowDown, Check, X, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteTask, useDeleteTasks, useIsCallerAdmin, useUpdateTaskComment, useFilterAndSortByClientName } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { Task, TaskFilter } from '../backend';
import { Type, Type__2, Type__3 } from '../backend';
import EditTaskDialog from './EditTaskDialog';
import BulkEditTasksDialog from './BulkEditTasksDialog';
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

interface TaskListProps {
  tasks: Task[];
  selectedTasks?: Set<number>;
  onSelectionChange?: (selected: Set<number>) => void;
  filterParams?: TaskFilter;
}

type SortField = 'dueDate' | 'assignmentDate' | 'completionDate' | 'clientName' | null;
type SortDirection = 'asc' | 'desc';

export default function TaskList({ tasks, selectedTasks: externalSelectedTasks, onSelectionChange, filterParams }: TaskListProps) {
  const { data: isAdmin } = useIsCallerAdmin();
  const { identity } = useInternetIdentity();
  const deleteTask = useDeleteTask();
  const deleteTasks = useDeleteTasks();
  const updateTaskComment = useUpdateTaskComment();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [internalSelectedTasks, setInternalSelectedTasks] = useState<Set<number>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Use external selection if provided, otherwise use internal
  const selectedTasks = externalSelectedTasks || internalSelectedTasks;
  const setSelectedTasks = onSelectionChange || setInternalSelectedTasks;

  // Client name sorting query
  const { data: clientNameSortedTasks, isLoading: isClientNameSorting } = useFilterAndSortByClientName(
    filterParams || {},
    sortDirection === 'asc',
    sortField === 'clientName'
  );

  // Check if we're showing completed tasks (all tasks have completed status)
  const isCompletedTasksView = tasks.length > 0 && tasks.every(task => task.status === Type__2.completed);

  // Sort tasks based on current sort settings
  const sortedTasks = useMemo(() => {
    // If sorting by client name and we have backend data, use it
    if (sortField === 'clientName' && clientNameSortedTasks && !isClientNameSorting) {
      return clientNameSortedTasks;
    }

    // Otherwise, use local sorting for date fields
    if (!sortField || sortField === 'clientName') return tasks;

    const sorted = [...tasks].sort((a, b) => {
      if (sortField === 'dueDate') {
        const aDate = a.dueDate;
        const bDate = b.dueDate;

        // Handle null/undefined dates - place them at the bottom
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;

        const comparison = Number(aDate) - Number(bDate);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (sortField === 'assignmentDate') {
        const aDate = a.assignmentDate;
        const bDate = b.assignmentDate;

        // Handle null/undefined dates - place them at the bottom
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;

        const comparison = Number(aDate) - Number(bDate);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (sortField === 'completionDate') {
        const aDate = a.completionDate;
        const bDate = b.completionDate;

        // Handle null/undefined dates - place them at the bottom
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;

        const comparison = Number(aDate) - Number(bDate);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      return 0;
    });

    return sorted;
  }, [tasks, sortField, sortDirection, clientNameSortedTasks, isClientNameSorting]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with ascending direction
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline-block opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1 inline-block" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1 inline-block" />
    );
  };

  const handleDelete = () => {
    if (deletingTask) {
      deleteTask.mutate(deletingTask.id);
      setDeletingTask(null);
    }
  };

  const handleBulkDelete = () => {
    const taskIds = Array.from(selectedTasks);
    deleteTasks.mutate(taskIds, {
      onSuccess: () => {
        setSelectedTasks(new Set());
        setShowBulkDelete(false);
      },
    });
  };

  const toggleSelectAll = () => {
    if (selectedTasks.size === sortedTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(sortedTasks.map((t) => t.id)));
    }
  };

  const toggleSelectTask = (taskId: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const canEditTask = (task: Task) => {
    if (isAdmin) return true;
    if (!identity) return false;
    return task.assignedTo.toString() === identity.getPrincipal().toString();
  };

  const startEditingComment = (task: Task) => {
    setEditingCommentId(task.id);
    setEditingCommentText(task.comment || '');
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const saveComment = (taskId: number) => {
    const trimmedComment = editingCommentText.trim();
    updateTaskComment.mutate(
      { taskId, comment: trimmedComment || null },
      {
        onSuccess: () => {
          setEditingCommentId(null);
          setEditingCommentText('');
        },
      }
    );
  };

  const getTaskTypeLabel = (taskType: Type__3): string => {
    switch (taskType) {
      case Type__3.GST:
        return 'GST';
      case Type__3.Audit:
        return 'Audit';
      case Type__3.ITNotice:
        return 'IT Notice';
      case Type__3.TDS:
        return 'TDS';
      case Type__3.Accounts:
        return 'Accounts';
      case Type__3.FormFiling:
        return 'Form Filing';
      case Type__3.CACertificate:
        return 'CA Certificate';
      case Type__3.Other:
        return 'Other';
      default:
        return 'Unknown';
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

  const getPaymentStatusVariant = (status: Type): 'outline' | 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case Type.pending:
        return 'outline';
      case Type.paid:
        return 'secondary';
      case Type.overdue:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (date?: bigint): string => {
    if (!date) return '-';
    const dateObj = new Date(Number(date) / 1000000);
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (date?: bigint): string => {
    if (!date) return '-';
    const dateObj = new Date(Number(date) / 1000000);
    return dateObj.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount?: bigint): string => {
    if (!amount) return '-';
    return `₹${Number(amount).toLocaleString()}`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const selectedTaskObjects = sortedTasks.filter((t) => selectedTasks.has(t.id));

  if (sortedTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No tasks found.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      {isAdmin && selectedTasks.size > 0 && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedTasks.size} task(s) selected</span>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={() => setShowBulkEdit(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Selected
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowBulkDelete(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {isAdmin && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedTasks.size === sortedTasks.length && sortedTasks.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all tasks"
                  />
                </TableHead>
              )}
              <TableHead className="w-[10%] min-w-[100px]">Title</TableHead>
              <TableHead 
                className="w-[8%] min-w-[90px] cursor-pointer select-none hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('clientName')}
              >
                <div className="flex items-center">
                  Client
                  {getSortIcon('clientName')}
                </div>
              </TableHead>
              <TableHead className="w-[7%] min-w-[80px]">Type</TableHead>
              <TableHead className="w-[7%] min-w-[80px]">Sub Type</TableHead>
              <TableHead className="w-[7%] min-w-[80px]">Status</TableHead>
              <TableHead className="w-[12%] min-w-[150px]">Comment</TableHead>
              <TableHead className="w-[7%] min-w-[80px]">Assigned To</TableHead>
              <TableHead 
                className="w-[6%] min-w-[80px] cursor-pointer select-none hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('dueDate')}
              >
                <div className="flex items-center">
                  Due Date
                  {getSortIcon('dueDate')}
                </div>
              </TableHead>
              {isCompletedTasksView && (
                <TableHead 
                  className="w-[7%] min-w-[110px] cursor-pointer select-none hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('completionDate')}
                >
                  <div className="flex items-center">
                    Completed On
                    {getSortIcon('completionDate')}
                  </div>
                </TableHead>
              )}
              <TableHead className="w-[6%] min-w-[80px]">Bill</TableHead>
              <TableHead className="w-[6%] min-w-[80px]">Advance</TableHead>
              <TableHead className="w-[6%] min-w-[90px]">Outstanding</TableHead>
              <TableHead className="w-[7%] min-w-[80px]">Payment</TableHead>
              <TableHead className="w-[60px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.map((task) => {
              const hasComment = task.comment && task.comment.trim().length > 0;
              const isEditingThisComment = editingCommentId === task.id;
              const canEdit = canEditTask(task);
              
              return (
                <TableRow key={task.id}>
                  {isAdmin && (
                    <TableCell>
                      <Checkbox
                        checked={selectedTasks.has(task.id)}
                        onCheckedChange={() => toggleSelectTask(task.id)}
                        aria-label={`Select ${task.title}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>{task.clientName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getTaskTypeLabel(task.taskType)}</Badge>
                  </TableCell>
                  <TableCell>
                    {task.subType ? (
                      <span className="text-sm text-muted-foreground">{task.subType}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(task.status)}>{getStatusLabel(task.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    {isEditingThisComment ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          rows={2}
                          className="text-sm"
                          placeholder="Enter comment..."
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveComment(task.id)}
                            disabled={updateTaskComment.isPending}
                          >
                            {updateTaskComment.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditingComment}
                            disabled={updateTaskComment.isPending}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`flex items-start gap-2 ${canEdit ? 'cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors' : ''}`}
                        onClick={() => canEdit && startEditingComment(task)}
                      >
                        {hasComment ? (
                          <>
                            <MessageSquare className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm text-foreground font-medium line-clamp-2">
                                  {truncateText(task.comment!, 40)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-md p-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                    <MessageSquare className="h-4 w-4" />
                                    <span>Comment</span>
                                  </div>
                                  <p className="whitespace-pre-wrap text-sm">{task.comment}</p>
                                  {canEdit && (
                                    <p className="text-xs text-muted-foreground italic mt-2">Click to edit</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            {canEdit ? 'Click to add' : '-'}
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.assignedName ? (
                      <span className="text-sm font-medium">{task.assignedName}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{formatDate(task.dueDate)}</span>
                  </TableCell>
                  {isCompletedTasksView && (
                    <TableCell>
                      <span className="text-sm font-medium text-green-600">
                        {formatDateTime(task.completionDate)}
                      </span>
                    </TableCell>
                  )}
                  <TableCell>
                    {task.bill ? (
                      <span className="text-sm font-medium">{task.bill}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-green-600">{formatCurrency(task.advanceReceived)}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${task.outstandingAmount && Number(task.outstandingAmount) > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      {formatCurrency(task.outstandingAmount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPaymentStatusVariant(task.paymentStatus)}>
                      {getPaymentStatusLabel(task.paymentStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canEditTask(task) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingTask(task)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem onClick={() => setDeletingTask(task)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {editingTask && <EditTaskDialog task={editingTask} open={true} onOpenChange={() => setEditingTask(null)} />}
      {showBulkEdit && (
        <BulkEditTasksDialog
          tasks={selectedTaskObjects}
          open={showBulkEdit}
          onOpenChange={(open) => {
            setShowBulkEdit(open);
            if (!open) setSelectedTasks(new Set());
          }}
        />
      )}

      <AlertDialog open={!!deletingTask} onOpenChange={() => setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTask?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Tasks</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTasks.size} task(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowBulkDelete(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={deleteTasks.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTasks.isPending ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
