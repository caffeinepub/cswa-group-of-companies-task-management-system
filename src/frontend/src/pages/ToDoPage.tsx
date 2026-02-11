import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetUserToDos, useAddToDoItem, useUpdateToDoItem, useDeleteToDoItem, useGetToDosForExport } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Plus, Calendar as CalendarIcon, Edit, Trash2, FileDown, CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ToDoFilterType, ToDoItem } from '../backend';
import { exportToDosToExcel } from '../lib/excelTemplates';

export default function ToDoPage() {
  const { identity } = useInternetIdentity();
  const userPrincipal = identity?.getPrincipal();

  const [filterType, setFilterType] = useState<ToDoFilterType>(ToDoFilterType.all);
  
  // Get all todos - the hook gets the user principal internally
  const { data: allToDos = [], isLoading: allToDosLoading } = useGetUserToDos();
  
  // Filter on the client side
  const filteredToDos = useMemo(() => {
    if (filterType === ToDoFilterType.all) {
      return allToDos;
    }
    
    // Filter for today
    const todayDayNumber = Math.floor(Date.now() / 86400000);
    return allToDos.filter(todo => {
      if (!todo.dueDate) return false;
      const dueDayNumber = Math.floor(Number(todo.dueDate) / 86400_000_000_000);
      return dueDayNumber === todayDayNumber;
    });
  }, [allToDos, filterType]);

  const { data: exportToDos = [] } = useGetToDosForExport();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedToDo, setSelectedToDo] = useState<ToDoItem | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [completed, setCompleted] = useState(false);

  const addToDoMutation = useAddToDoItem();
  const updateToDoMutation = useUpdateToDoItem();
  const deleteToDoMutation = useDeleteToDoItem();

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(undefined);
    setCompleted(false);
  };

  const handleAdd = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      await addToDoMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate ? BigInt(dueDate.getTime()) * BigInt(1000000) : undefined,
      });
      toast.success('To-Do item added successfully');
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to add to-do item: ' + (error as Error).message);
    }
  };

  const handleEdit = (todo: ToDoItem) => {
    setSelectedToDo(todo);
    setTitle(todo.title);
    setDescription(todo.description || '');
    setDueDate(todo.dueDate ? new Date(Number(todo.dueDate) / 1000000) : undefined);
    setCompleted(todo.completed);
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!selectedToDo || !userPrincipal) return;

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      await updateToDoMutation.mutateAsync({
        request: {
          owner: userPrincipal,
          todoId: selectedToDo.id,
        },
        updatedToDoItem: {
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate ? BigInt(dueDate.getTime()) * BigInt(1000000) : undefined,
          completed,
        },
      });
      toast.success('To-Do item updated successfully');
      setShowEditDialog(false);
      resetForm();
      setSelectedToDo(null);
    } catch (error) {
      toast.error('Failed to update to-do item: ' + (error as Error).message);
    }
  };

  const handleDelete = (todo: ToDoItem) => {
    setSelectedToDo(todo);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedToDo || !userPrincipal) return;

    try {
      await deleteToDoMutation.mutateAsync({
        owner: userPrincipal,
        todoId: selectedToDo.id,
      });
      toast.success('To-Do item deleted successfully');
      setShowDeleteDialog(false);
      setSelectedToDo(null);
    } catch (error) {
      toast.error('Failed to delete to-do item: ' + (error as Error).message);
    }
  };

  const handleToggleComplete = async (todo: ToDoItem) => {
    if (!userPrincipal) return;

    try {
      await updateToDoMutation.mutateAsync({
        request: {
          owner: userPrincipal,
          todoId: todo.id,
        },
        updatedToDoItem: {
          title: todo.title,
          description: todo.description || undefined,
          dueDate: todo.dueDate || undefined,
          completed: !todo.completed,
        },
      });
      toast.success(todo.completed ? 'Marked as incomplete' : 'Marked as complete');
    } catch (error) {
      toast.error('Failed to update to-do item: ' + (error as Error).message);
    }
  };

  const handleExport = () => {
    try {
      if (exportToDos.length === 0) {
        toast.error('No to-do items to export');
        return;
      }
      exportToDosToExcel(exportToDos);
      toast.success(`Successfully exported ${exportToDos.length} to-do item(s) to Excel`);
    } catch (error) {
      toast.error('Failed to export to-do items: ' + (error as Error).message);
    }
  };

  if (allToDosLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading to-do list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">To-Do List</h1>
          <p className="text-muted-foreground text-lg">Manage your personal tasks and reminders</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" disabled={exportToDos.length === 0} className="shadow-soft">
            <FileDown className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="shadow-soft">
            <Plus className="h-4 w-4 mr-2" />
            Add To-Do
          </Button>
        </div>
      </div>

      <Card className="shadow-soft-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Your To-Do Items</CardTitle>
            <Select value={filterType} onValueChange={(value) => setFilterType(value as ToDoFilterType)}>
              <SelectTrigger className="w-[180px] shadow-inner-soft">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ToDoFilterType.all}>All Items</SelectItem>
                <SelectItem value={ToDoFilterType.today}>Due Today</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredToDos.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No to-do items found. Add your first task to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredToDos.map((todo) => (
                <div
                  key={todo.id}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:shadow-soft transition-all duration-200',
                    todo.completed && 'opacity-60'
                  )}
                >
                  <button
                    onClick={() => handleToggleComplete(todo)}
                    className="mt-1 flex-shrink-0"
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className={cn('font-semibold text-foreground', todo.completed && 'line-through')}>
                      {todo.title}
                    </h3>
                    {todo.description && (
                      <p className="text-sm text-muted-foreground mt-1">{todo.description}</p>
                    )}
                    {todo.dueDate && (
                      <div className="flex items-center gap-2 mt-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Due: {format(new Date(Number(todo.dueDate) / 1000000), 'PPP')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(todo)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(todo)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="shadow-soft-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New To-Do</DialogTitle>
            <DialogDescription>Create a new task or reminder</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter task title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="shadow-inner-soft"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="shadow-inner-soft"
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal shadow-inner-soft',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={addToDoMutation.isPending}>
              {addToDoMutation.isPending ? 'Adding...' : 'Add To-Do'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="shadow-soft-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit To-Do</DialogTitle>
            <DialogDescription>Update your task details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                placeholder="Enter task title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="shadow-inner-soft"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Enter task description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="shadow-inner-soft"
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal shadow-inner-soft',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="completed" checked={completed} onCheckedChange={(checked) => setCompleted(checked as boolean)} />
              <Label htmlFor="completed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Mark as completed
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); resetForm(); setSelectedToDo(null); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateToDoMutation.isPending}>
              {updateToDoMutation.isPending ? 'Updating...' : 'Update To-Do'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="shadow-soft-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Delete To-Do</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedToDo?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setSelectedToDo(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteToDoMutation.isPending}>
              {deleteToDoMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

