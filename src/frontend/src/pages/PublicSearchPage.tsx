import { useState, useEffect, useMemo } from 'react';
import { Search, Users, Building2, CheckSquare, ChevronDown, ChevronRight, AlertCircle, RefreshCw, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { usePublicSearchTeamMembers, usePublicSearchClients, usePublicSearchTasks, usePublicSearchTasksByAssignee } from '../hooks/useQueries';
import type { Type, Type__2, Type__3, Type__4, PublicTask } from '../backend';
import { formatDate, formatOptionalText } from '../utils/formatters';
import TeamMemberTasksTable from '../components/public-search/TeamMemberTasksTable';
import { exportPublicSearchTasksToExcel } from '../lib/excelTemplates';

type SortColumn = 'title' | 'clientName' | 'assignedName' | 'status' | 'paymentStatus' | 'assignedDate' | 'dueDate' | 'completionDate';
type SortDirection = 'asc' | 'desc' | null;

export default function PublicSearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { 
    data: teamMembers = [], 
    isLoading: teamMembersLoading,
    isError: teamMembersError,
    error: teamMembersErrorObj,
    refetch: refetchTeamMembers
  } = usePublicSearchTeamMembers(debouncedSearchTerm);
  
  const { 
    data: clients = [], 
    isLoading: clientsLoading,
    isError: clientsError,
    error: clientsErrorObj,
    refetch: refetchClients
  } = usePublicSearchClients(debouncedSearchTerm);
  
  const { 
    data: tasks = [], 
    isLoading: tasksLoading,
    isError: tasksError,
    error: tasksErrorObj,
    refetch: refetchTasks
  } = usePublicSearchTasks(debouncedSearchTerm);
  
  const { 
    data: tasksByAssignee = [], 
    isLoading: tasksByAssigneeLoading,
    isError: tasksByAssigneeError,
    error: tasksByAssigneeErrorObj,
    refetch: refetchTasksByAssignee
  } = usePublicSearchTasksByAssignee(debouncedSearchTerm);

  // Combine tasks from both searches and remove duplicates
  const allTasks = useMemo(() => {
    const taskMap = new Map();
    
    // Add tasks from title/client search
    tasks.forEach(task => {
      const key = `${task.title}-${task.clientName}-${task.assignedName}`;
      taskMap.set(key, task);
    });
    
    // Add tasks from assignee search
    tasksByAssignee.forEach(task => {
      const key = `${task.title}-${task.clientName}-${task.assignedName}`;
      taskMap.set(key, task);
    });
    
    return Array.from(taskMap.values());
  }, [tasks, tasksByAssignee]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    if (!sortColumn || !sortDirection) return allTasks;

    const sorted = [...allTasks].sort((a, b) => {
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
        case 'assignedName':
          aVal = a.assignedName.toLowerCase();
          bVal = b.assignedName.toLowerCase();
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
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
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [allTasks, sortColumn, sortDirection]);

  // Group tasks by assignee name for team members
  const tasksByMember = useMemo(() => {
    const grouped = new Map<string, typeof tasksByAssignee>();
    
    tasksByAssignee.forEach(task => {
      const existing = grouped.get(task.assignedName) || [];
      grouped.set(task.assignedName, [...existing, task]);
    });
    
    return grouped;
  }, [tasksByAssignee]);

  const combinedTasksLoading = tasksLoading || tasksByAssigneeLoading;
  const combinedTasksError = tasksError || tasksByAssigneeError;

  const toggleMemberExpansion = (memberName: string) => {
    setExpandedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberName)) {
        newSet.delete(memberName);
      } else {
        newSet.add(memberName);
      }
      return newSet;
    });
  };

  const handleRetryTeam = () => {
    refetchTeamMembers();
    refetchTasksByAssignee();
  };

  const handleRetryClients = () => {
    refetchClients();
  };

  const handleRetryTasks = () => {
    refetchTasks();
    refetchTasksByAssignee();
  };

  const getTaskKey = (task: PublicTask) => {
    return `${task.title}-${task.clientName}-${task.assignedName}`;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = new Set(sortedTasks.map(getTaskKey));
      setSelectedTasks(allKeys);
    } else {
      setSelectedTasks(new Set());
    }
  };

  const handleSelectTask = (task: PublicTask, checked: boolean) => {
    const key = getTaskKey(task);
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
      return newSet;
    });
  };

  const handleExportSelected = () => {
    setExportError(null);
    
    if (selectedTasks.size === 0) {
      setExportError('No tasks selected for export');
      return;
    }

    const tasksToExport = sortedTasks.filter(task => selectedTasks.has(getTaskKey(task)));
    exportPublicSearchTasksToExcel(tasksToExport);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction or clear
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

  const getStatusBadge = (status: Type__2) => {
    const variants: Record<Type__2, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      inProgress: 'default',
      completed: 'default',
    };
    const labels: Record<Type__2, string> = {
      pending: 'Pending',
      inProgress: 'In Progress',
      completed: 'Completed',
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

  const getClientStatusBadge = (status: Type__4) => {
    const variants: Record<Type__4, 'default' | 'secondary'> = {
      active: 'default',
      inactive: 'secondary',
    };
    const labels: Record<Type__4, string> = {
      active: 'Active',
      inactive: 'Inactive',
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

  const allSelected = sortedTasks.length > 0 && selectedTasks.size === sortedTasks.length;
  const someSelected = selectedTasks.size > 0 && selectedTasks.size < sortedTasks.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <img src="/assets/image-2.png" alt="CSWA Logo" className="h-12 w-auto" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">CSWA Group of Companies</h1>
            <p className="text-sm text-muted-foreground">Public Search Portal</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search
            </CardTitle>
            <CardDescription>
              Search for team members, clients, and tasks by name, title, or keyword. When searching for a person's name, all tasks assigned to them will be displayed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter search term..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="team" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members ({teamMembers.length})
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Clients ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Tasks ({allTasks.length})
            </TabsTrigger>
          </TabsList>

          {/* Team Members Tab */}
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Search results for team members and their assigned tasks</CardDescription>
              </CardHeader>
              <CardContent>
                {teamMembersError || tasksByAssigneeError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Team Members</AlertTitle>
                    <AlertDescription className="mt-2 space-y-2">
                      <p>
                        {teamMembersError 
                          ? (teamMembersErrorObj as Error)?.message || 'Failed to load team members'
                          : (tasksByAssigneeErrorObj as Error)?.message || 'Failed to load assigned tasks'}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRetryTeam}
                        className="mt-2"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : teamMembersLoading || tasksByAssigneeLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {debouncedSearchTerm ? 'No team members found' : 'Enter a search term to find team members'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {teamMembers.map((member, index) => {
                      const memberTasks = tasksByMember.get(member.name) || [];
                      const isExpanded = expandedMembers.has(member.name);
                      
                      return (
                        <Collapsible
                          key={index}
                          open={isExpanded}
                          onOpenChange={() => toggleMemberExpansion(member.name)}
                        >
                          <div className="rounded-md border">
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                className="w-full justify-between p-4 h-auto hover:bg-muted/50"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-base">{member.name}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {memberTasks.length} {memberTasks.length === 1 ? 'task' : 'tasks'}
                                  </Badge>
                                </div>
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="border-t p-4 bg-muted/20">
                                <TeamMemberTasksTable tasks={memberTasks} />
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Clients</CardTitle>
                <CardDescription>Search results for clients</CardDescription>
              </CardHeader>
              <CardContent>
                {clientsError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Clients</AlertTitle>
                    <AlertDescription className="mt-2 space-y-2">
                      <p>{(clientsErrorObj as Error)?.message || 'Failed to load clients'}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRetryClients}
                        className="mt-2"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : clientsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : clients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {debouncedSearchTerm ? 'No clients found' : 'Enter a search term to find clients'}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients.map((client, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>{getClientStatusBadge(client.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tasks</span>
                  <Button
                    onClick={handleExportSelected}
                    disabled={selectedTasks.size === 0}
                    size="sm"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected ({selectedTasks.size})
                  </Button>
                </CardTitle>
                <CardDescription>
                  Search results for tasks (includes tasks by title, client name, and assigned person)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {exportError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Export Error</AlertTitle>
                    <AlertDescription>{exportError}</AlertDescription>
                  </Alert>
                )}
                {combinedTasksError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Tasks</AlertTitle>
                    <AlertDescription className="mt-2 space-y-2">
                      <p>
                        {tasksError 
                          ? (tasksErrorObj as Error)?.message || 'Failed to load tasks'
                          : (tasksByAssigneeErrorObj as Error)?.message || 'Failed to load assigned tasks'}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRetryTasks}
                        className="mt-2"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : combinedTasksLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : allTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {debouncedSearchTerm ? 'No tasks found' : 'Enter a search term to find tasks'}
                  </div>
                ) : (
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
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('title')}
                          >
                            Title {getSortIcon('title')}
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('clientName')}
                          >
                            Client {getSortIcon('clientName')}
                          </TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Task Sub Type</TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('assignedName')}
                          >
                            Assigned To {getSortIcon('assignedName')}
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('status')}
                          >
                            Status {getSortIcon('status')}
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('paymentStatus')}
                          >
                            Payment Status {getSortIcon('paymentStatus')}
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('assignedDate')}
                          >
                            Assigned Date {getSortIcon('assignedDate')}
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('dueDate')}
                          >
                            Due Date {getSortIcon('dueDate')}
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('completionDate')}
                          >
                            Completion Date {getSortIcon('completionDate')}
                          </TableHead>
                          <TableHead>Comment</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedTasks.map((task, index) => {
                          const taskKey = getTaskKey(task);
                          const isSelected = selectedTasks.has(taskKey);
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleSelectTask(task, checked as boolean)}
                                  aria-label={`Select ${task.title}`}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{task.title}</TableCell>
                              <TableCell>{task.clientName}</TableCell>
                              <TableCell>{getTaskTypeLabel(task.taskType)}</TableCell>
                              <TableCell>{getTaskTypeLabel(task.taskSubType)}</TableCell>
                              <TableCell>{task.assignedName}</TableCell>
                              <TableCell>{getStatusBadge(task.status)}</TableCell>
                              <TableCell>{getPaymentStatusBadge(task.paymentStatus)}</TableCell>
                              <TableCell>{formatDate(task.assignedDate)}</TableCell>
                              <TableCell>{formatDate(task.dueDate)}</TableCell>
                              <TableCell>
                                {task.status === 'completed' ? formatDate(task.completionDate) : '—'}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {formatOptionalText(task.comment)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2026. Built with love using{' '}
          <a 
            href="https://caffeine.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
