import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useGetClients, useFilterTasks, useIsCallerAdmin, useGetAllTeamMembers, useGetTasksForExport, useGetSelectedTasksForExport, useSearchTasksByDate } from '../hooks/useQueries';
import { Plus, Upload, Download, X, FileDown, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Type, Type__2, Type__3 } from '../backend';
import TaskList from '../components/TaskList';
import CreateTaskDialog from '../components/CreateTaskDialog';
import BulkImportTasksDialog from '../components/BulkImportTasksDialog';
import { downloadTaskTemplate, exportTasksToExcel } from '../lib/excelTemplates';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function TasksPage() {
  const { data: clients = [] } = useGetClients();
  const { data: teamMembers = [] } = useGetAllTeamMembers();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: exportTasks = [] } = useGetTasksForExport();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingSelected, setIsExportingSelected] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());

  // Filter states
  const [taskTypeFilter, setTaskTypeFilter] = useState<Type__3 | 'all'>('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState<Type__2 | 'all'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<Type | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [subTypeFilter, setSubTypeFilter] = useState<string>('');
  const [commentFilter, setCommentFilter] = useState<string>('');
  const [assigneeSearchFilter, setAssigneeSearchFilter] = useState<string>('');
  const [clientNameSearchFilter, setClientNameSearchFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  // Debounced search filters
  const [debouncedAssigneeSearch, setDebouncedAssigneeSearch] = useState<string>('');
  const [debouncedClientNameSearch, setDebouncedClientNameSearch] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAssigneeSearch(assigneeSearchFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [assigneeSearchFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedClientNameSearch(clientNameSearchFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [clientNameSearchFilter]);

  // Convert Date to Time (nanoseconds) for backend with proper local timezone handling
  const dateFilterTime = useMemo(() => {
    if (!dateFilter) return undefined;
    
    const localDate = new Date(dateFilter);
    localDate.setHours(0, 0, 0, 0);
    
    return BigInt(localDate.getTime()) * BigInt(1000000);
  }, [dateFilter]);

  // Use date-based search when date filter is active
  const { data: dateSearchTasks = [], isLoading: isDateSearchLoading, isFetching: isDateSearchFetching } = useSearchTasksByDate(
    dateFilterTime || BigInt(0),
    !!dateFilterTime
  );

  // Build filter params for backend (for regular filtering without date)
  const filterParams = useMemo(() => {
    return {
      taskType: taskTypeFilter !== 'all' ? taskTypeFilter : undefined,
      status: taskStatusFilter !== 'all' ? taskStatusFilter : undefined,
      paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
      assigneeName: assigneeFilter !== 'all' ? assigneeFilter : undefined,
      subType: subTypeFilter.trim() || undefined,
      searchTerm: debouncedClientNameSearch.trim() || undefined,
    };
  }, [taskTypeFilter, taskStatusFilter, paymentStatusFilter, assigneeFilter, subTypeFilter, debouncedClientNameSearch]);

  const { data: backendFilteredTasks = [], isError, error } = useFilterTasks(filterParams);

  // Show error toast if filtering fails
  useEffect(() => {
    if (isError && error) {
      toast.error(`Filter error: ${error.message}`);
    }
  }, [isError, error]);

  // Apply client-side filters
  const filteredTasks = useMemo(() => {
    let tasks = dateFilter ? dateSearchTasks : backendFilteredTasks;

    // Apply comment filter
    if (commentFilter.trim()) {
      const searchTerm = commentFilter.toLowerCase().trim();
      tasks = tasks.filter(task => 
        task.comment?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply assignee search filter
    if (debouncedAssigneeSearch.trim()) {
      const searchTerm = debouncedAssigneeSearch.toLowerCase().trim();
      tasks = tasks.filter(task =>
        task.assignedName.toLowerCase().includes(searchTerm)
      );
    }

    // Apply other filters when date filter is active
    if (dateFilter) {
      if (taskTypeFilter !== 'all') {
        tasks = tasks.filter(task => task.taskType === taskTypeFilter);
      }
      if (taskStatusFilter !== 'all') {
        tasks = tasks.filter(task => task.status === taskStatusFilter);
      }
      if (paymentStatusFilter !== 'all') {
        tasks = tasks.filter(task => task.paymentStatus === paymentStatusFilter);
      }
      if (assigneeFilter !== 'all') {
        tasks = tasks.filter(task => task.assignedName === assigneeFilter);
      }
      if (subTypeFilter.trim()) {
        tasks = tasks.filter(task => task.subType === subTypeFilter.trim());
      }
      if (debouncedClientNameSearch.trim()) {
        const searchTerm = debouncedClientNameSearch.toLowerCase().trim();
        tasks = tasks.filter(task => task.clientName.toLowerCase().includes(searchTerm));
      }
    }

    return tasks;
  }, [backendFilteredTasks, dateSearchTasks, dateFilter, commentFilter, debouncedAssigneeSearch, taskTypeFilter, taskStatusFilter, paymentStatusFilter, assigneeFilter, subTypeFilter, debouncedClientNameSearch]);

  // Categorize tasks by status
  const pendingTasks = filteredTasks.filter((t) => t.status === Type__2.pending);
  const inProgressTasks = filteredTasks.filter((t) => t.status === Type__2.inProgress);
  const completedTasks = filteredTasks.filter((t) => t.status === Type__2.completed);

  const hasActiveFilters = 
    taskTypeFilter !== 'all' || 
    taskStatusFilter !== 'all' || 
    paymentStatusFilter !== 'all' || 
    assigneeFilter !== 'all' ||
    subTypeFilter.trim() !== '' ||
    commentFilter.trim() !== '' ||
    assigneeSearchFilter.trim() !== '' ||
    clientNameSearchFilter.trim() !== '' ||
    dateFilter !== undefined;

  const clearFilters = () => {
    setTaskTypeFilter('all');
    setTaskStatusFilter('all');
    setPaymentStatusFilter('all');
    setAssigneeFilter('all');
    setSubTypeFilter('');
    setCommentFilter('');
    setAssigneeSearchFilter('');
    setClientNameSearchFilter('');
    setDateFilter(undefined);
  };

  const handleExportTasks = () => {
    try {
      setIsExporting(true);
      const tasksToExport = dateFilter ? filteredTasks : exportTasks;
      if (tasksToExport.length === 0) {
        toast.error('No tasks available to export');
        return;
      }
      exportTasksToExcel(tasksToExport);
      toast.success(`Successfully exported ${tasksToExport.length} task(s) to Excel`);
    } catch (error) {
      toast.error('Failed to export tasks: ' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const { refetch: fetchSelectedTasks } = useGetSelectedTasksForExport(Array.from(selectedTasks));

  const handleExportSelectedTasks = async () => {
    try {
      setIsExportingSelected(true);
      if (selectedTasks.size === 0) {
        toast.error('No tasks selected for export');
        return;
      }
      
      const { data: selectedTasksData } = await fetchSelectedTasks();
      
      if (!selectedTasksData || selectedTasksData.length === 0) {
        toast.error('No tasks available to export');
        return;
      }
      
      exportTasksToExcel(selectedTasksData);
      toast.success(`Successfully exported ${selectedTasksData.length} selected task(s) to Excel`);
      setSelectedTasks(new Set());
    } catch (error) {
      toast.error('Failed to export selected tasks: ' + (error as Error).message);
    } finally {
      setIsExportingSelected(false);
    }
  };

  const isLoadingDateFilter = dateFilter && (isDateSearchLoading || isDateSearchFetching);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Task Management</h1>
          <p className="text-muted-foreground text-lg">Track and manage client tasks</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && selectedTasks.size > 0 && (
            <Button 
              onClick={handleExportSelectedTasks} 
              disabled={isExportingSelected} 
              variant="default"
              className="shadow-soft"
            >
              <FileDown className="h-4 w-4 mr-2" />
              {isExportingSelected ? 'Exporting...' : `Export Selected (${selectedTasks.size})`}
            </Button>
          )}
          <Button onClick={handleExportTasks} disabled={isExporting || filteredTasks.length === 0} variant="outline" className="shadow-soft">
            <FileDown className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </Button>
          {isAdmin && (
            <>
              <Button onClick={() => downloadTaskTemplate(clients, teamMembers)} variant="outline" className="shadow-soft">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <Button onClick={() => setShowBulkImport(true)} variant="outline" className="shadow-soft">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
            </>
          )}
          <Button onClick={() => setShowCreateDialog(true)} className="shadow-soft">
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </div>

      <Card className="shadow-soft-lg">
        <CardContent className="pt-6">
          {/* Filter Section */}
          <Card className="mb-6 shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">Filter Tasks</CardTitle>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Task Type Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Task Type</Label>
                  <Select value={taskTypeFilter} onValueChange={(value) => setTaskTypeFilter(value as Type__3 | 'all')}>
                    <SelectTrigger className="shadow-inner-soft">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
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

                {/* Task Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Task Status</Label>
                  <Select value={taskStatusFilter} onValueChange={(value) => setTaskStatusFilter(value as Type__2 | 'all')}>
                    <SelectTrigger className="shadow-inner-soft">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value={Type__2.pending}>Pending</SelectItem>
                      <SelectItem value={Type__2.inProgress}>In Progress</SelectItem>
                      <SelectItem value={Type__2.completed}>Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Payment Status</Label>
                  <Select value={paymentStatusFilter} onValueChange={(value) => setPaymentStatusFilter(value as Type | 'all')}>
                    <SelectTrigger className="shadow-inner-soft">
                      <SelectValue placeholder="All Payment Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payment Statuses</SelectItem>
                      <SelectItem value={Type.pending}>Pending</SelectItem>
                      <SelectItem value={Type.paid}>Paid</SelectItem>
                      <SelectItem value={Type.overdue}>Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Assignee</Label>
                  <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                    <SelectTrigger className="shadow-inner-soft">
                      <SelectValue placeholder="All Assignees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assignees</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.principal.toString()} value={member.name}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sub Type Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Sub Type</Label>
                  <Input
                    placeholder="Filter by sub type..."
                    value={subTypeFilter}
                    onChange={(e) => setSubTypeFilter(e.target.value)}
                    className="shadow-inner-soft"
                  />
                </div>

                {/* Comment Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Comment</Label>
                  <Input
                    placeholder="Search in comments..."
                    value={commentFilter}
                    onChange={(e) => setCommentFilter(e.target.value)}
                    className="shadow-inner-soft"
                  />
                </div>

                {/* Assignee Search Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Search Assignee</Label>
                  <Input
                    placeholder="Search by assignee name..."
                    value={assigneeSearchFilter}
                    onChange={(e) => setAssigneeSearchFilter(e.target.value)}
                    className="shadow-inner-soft"
                  />
                </div>

                {/* Client Name Search Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Search Client</Label>
                  <Input
                    placeholder="Search by client name..."
                    value={clientNameSearchFilter}
                    onChange={(e) => setClientNameSearchFilter(e.target.value)}
                    className="shadow-inner-soft"
                  />
                </div>

                {/* Date Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Date Filter</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal shadow-inner-soft',
                          !dateFilter && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFilter ? format(dateFilter, 'PPP') : 'Pick a date'}
                        {isLoadingDateFilter && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFilter}
                        onSelect={setDateFilter}
                        initialFocus
                      />
                      {dateFilter && (
                        <div className="p-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setDateFilter(undefined)}
                          >
                            Clear Date
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="all" className="font-medium">All Tasks ({filteredTasks.length})</TabsTrigger>
              <TabsTrigger value="pending" className="font-medium">Pending ({pendingTasks.length})</TabsTrigger>
              <TabsTrigger value="inProgress" className="font-medium">In Progress ({inProgressTasks.length})</TabsTrigger>
              <TabsTrigger value="completed" className="font-medium">Completed ({completedTasks.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <TaskList tasks={filteredTasks} selectedTasks={selectedTasks} onSelectionChange={setSelectedTasks} />
            </TabsContent>

            <TabsContent value="pending">
              <TaskList tasks={pendingTasks} selectedTasks={selectedTasks} onSelectionChange={setSelectedTasks} />
            </TabsContent>

            <TabsContent value="inProgress">
              <TaskList tasks={inProgressTasks} selectedTasks={selectedTasks} onSelectionChange={setSelectedTasks} />
            </TabsContent>

            <TabsContent value="completed">
              <TaskList tasks={completedTasks} selectedTasks={selectedTasks} onSelectionChange={setSelectedTasks} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {showCreateDialog && <CreateTaskDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />}
      {showBulkImport && <BulkImportTasksDialog open={showBulkImport} onOpenChange={setShowBulkImport} />}
    </div>
  );
}

