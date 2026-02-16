import { useState } from 'react';
import { Search, Download, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from '@tanstack/react-router';
import {
  usePublicSearchTeamMembers,
  usePublicSearchClients,
  usePublicSearchTasks,
  usePublicSearchTasksByAssignee,
} from '../hooks/useQueries';
import { toast } from 'sonner';
import { exportPublicSearchTasksToExcel, exportPublicSearchTasksByAssigneeToExcel } from '../lib/excelTemplates';
import { formatDate } from '../utils/formatters';
import { Type__2, Type__3, Type } from '../backend';
import { getTaskStatusLabel, getTaskStatusOptions } from '../utils/taskStatus';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

const getTaskTypeLabel = (type: Type__3): string => {
  const labels: Record<Type__3, string> = {
    [Type__3.GST]: 'GST',
    [Type__3.Audit]: 'Audit',
    [Type__3.ITNotice]: 'IT Notice',
    [Type__3.Other]: 'Other',
    [Type__3.TDS]: 'TDS',
    [Type__3.Accounts]: 'Accounts',
    [Type__3.FormFiling]: 'Form Filing',
    [Type__3.CACertificate]: 'CA Certificate',
  };
  return labels[type] || type;
};

const getPaymentStatusLabel = (status: Type): string => {
  const labels: Record<Type, string> = {
    [Type.pending]: 'Pending',
    [Type.paid]: 'Paid',
    [Type.overdue]: 'Overdue',
  };
  return labels[status] || status;
};

const getPaymentStatusVariant = (status: Type): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case Type.paid:
      return 'default';
    case Type.pending:
      return 'secondary';
    case Type.overdue:
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getTaskStatusVariant = (status: Type__2): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (status) {
    case Type__2.completed:
      return 'default';
    case Type__2.inProgress:
      return 'secondary';
    case Type__2.pending:
      return 'outline';
    case Type__2.docsPending:
      return 'secondary';
    case Type__2.hold:
      return 'destructive';
    default:
      return 'outline';
  }
};

const taskStatusOrder: Record<Type__2, number> = {
  [Type__2.pending]: 0,
  [Type__2.inProgress]: 1,
  [Type__2.docsPending]: 2,
  [Type__2.hold]: 3,
  [Type__2.completed]: 4,
};

const compareTaskStatus = (a: Type__2, b: Type__2): number => {
  return taskStatusOrder[a] - taskStatusOrder[b];
};

export default function PublicSearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('team');
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<Set<string>>(new Set());
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const navigate = useNavigate();

  const { data: teamMembers = [], isLoading: teamLoading } = usePublicSearchTeamMembers(searchTerm);
  const { data: clients = [], isLoading: clientsLoading } = usePublicSearchClients(searchTerm);
  const { data: tasks = [], isLoading: tasksLoading } = usePublicSearchTasks(searchTerm);
  const { data: tasksByAssignee = [], isLoading: tasksByAssigneeLoading } = usePublicSearchTasksByAssignee(searchTerm);

  const handleBack = () => {
    navigate({ to: '/' });
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedTasks = (tasksToSort: typeof tasks) => {
    if (!sortConfig) return tasksToSort;

    return [...tasksToSort].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'clientName':
          aValue = a.clientName.toLowerCase();
          bValue = b.clientName.toLowerCase();
          break;
        case 'dueDate':
          aValue = a.dueDate ? Number(a.dueDate) : Number.MAX_SAFE_INTEGER;
          bValue = b.dueDate ? Number(b.dueDate) : Number.MAX_SAFE_INTEGER;
          break;
        case 'completionDate':
          aValue = a.completionDate ? Number(a.completionDate) : Number.MAX_SAFE_INTEGER;
          bValue = b.completionDate ? Number(b.completionDate) : Number.MAX_SAFE_INTEGER;
          break;
        case 'status':
          return sortConfig.direction === 'asc'
            ? compareTaskStatus(a.status, b.status)
            : compareTaskStatus(b.status, a.status);
        case 'subType':
          aValue = (a.subType || '').toLowerCase();
          bValue = (b.subType || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const getSortedTasksByAssignee = (tasksToSort: typeof tasksByAssignee) => {
    if (!sortConfig) return tasksToSort;

    return [...tasksToSort].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'clientName':
          aValue = a.clientName.toLowerCase();
          bValue = b.clientName.toLowerCase();
          break;
        case 'dueDate':
          aValue = a.dueDate ? Number(a.dueDate) : Number.MAX_SAFE_INTEGER;
          bValue = b.dueDate ? Number(b.dueDate) : Number.MAX_SAFE_INTEGER;
          break;
        case 'completionDate':
          aValue = a.completionDate ? Number(a.completionDate) : Number.MAX_SAFE_INTEGER;
          bValue = b.completionDate ? Number(b.completionDate) : Number.MAX_SAFE_INTEGER;
          break;
        case 'status':
          return sortConfig.direction === 'asc'
            ? compareTaskStatus(a.status, b.status)
            : compareTaskStatus(b.status, a.status);
        case 'taskSubType':
          aValue = getTaskTypeLabel(a.taskSubType).toLowerCase();
          bValue = getTaskTypeLabel(b.taskSubType).toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const renderSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 inline" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4 inline" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4 inline" />
    );
  };

  const handleExportSelected = () => {
    if (activeTab === 'team') {
      if (selectedTeamMembers.size === 0) {
        toast.error('Please select at least one team member to export');
        return;
      }
      const selectedData = teamMembers.filter((member) => selectedTeamMembers.has(member.name));
      toast.success(`Exported ${selectedData.length} team member(s)`);
    } else if (activeTab === 'clients') {
      if (selectedClients.size === 0) {
        toast.error('Please select at least one client to export');
        return;
      }
      const selectedData = clients.filter((client) => selectedClients.has(client.name));
      toast.success(`Exported ${selectedData.length} client(s)`);
    } else if (activeTab === 'tasks') {
      if (selectedTasks.size === 0) {
        toast.error('Please select at least one task to export');
        return;
      }
      const selectedData = tasks.filter((_, index) => selectedTasks.has(index));
      exportPublicSearchTasksToExcel(selectedData);
      toast.success(`Exported ${selectedData.length} task(s)`);
    } else if (activeTab === 'tasksByAssignee') {
      if (selectedTasks.size === 0) {
        toast.error('Please select at least one task to export');
        return;
      }
      const selectedData = tasksByAssignee.filter((_, index) => selectedTasks.has(index));
      exportPublicSearchTasksByAssigneeToExcel(selectedData);
      toast.success(`Exported ${selectedData.length} task(s)`);
    }
  };

  const toggleTeamMemberSelection = (name: string) => {
    const newSelection = new Set(selectedTeamMembers);
    if (newSelection.has(name)) {
      newSelection.delete(name);
    } else {
      newSelection.add(name);
    }
    setSelectedTeamMembers(newSelection);
  };

  const toggleClientSelection = (name: string) => {
    const newSelection = new Set(selectedClients);
    if (newSelection.has(name)) {
      newSelection.delete(name);
    } else {
      newSelection.add(name);
    }
    setSelectedClients(newSelection);
  };

  const toggleTaskSelection = (index: number) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedTasks(newSelection);
  };

  const toggleAllTeamMembers = () => {
    if (selectedTeamMembers.size === teamMembers.length) {
      setSelectedTeamMembers(new Set());
    } else {
      setSelectedTeamMembers(new Set(teamMembers.map((m) => m.name)));
    }
  };

  const toggleAllClients = () => {
    if (selectedClients.size === clients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(clients.map((c) => c.name)));
    }
  };

  const toggleAllTasks = () => {
    const currentTasks = activeTab === 'tasks' ? tasks : tasksByAssignee;
    if (selectedTasks.size === currentTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(currentTasks.map((_, index) => index)));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 dark:from-primary/3 dark:via-background dark:to-accent/5">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack} className="hover:bg-accent/20 dark:hover:bg-accent/15">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Public Search</h1>
              <p className="text-muted-foreground">Search for team members, clients, and tasks</p>
            </div>
          </div>
        </div>

        <Card className="shadow-soft bg-card/95 dark:bg-card/98">
          <CardHeader>
            <CardTitle>Search</CardTitle>
            <CardDescription>Enter a search term to find team members, clients, or tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleExportSelected} variant="outline" className="hover:bg-accent/20 dark:hover:bg-accent/15">
                <Download className="mr-2 h-4 w-4" />
                Export Selected
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 dark:bg-muted/70">
            <TabsTrigger value="team">Team Members</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="tasksByAssignee">Tasks by Assignee</TabsTrigger>
          </TabsList>

          <TabsContent value="team">
            <Card className="shadow-soft bg-card/95 dark:bg-card/98">
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  {teamLoading ? 'Loading...' : `Found ${teamMembers.length} team member(s)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedTeamMembers.size === teamMembers.length && teamMembers.length > 0}
                          onCheckedChange={toggleAllTeamMembers}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member.name}>
                        <TableCell>
                          <Checkbox
                            checked={selectedTeamMembers.has(member.name)}
                            onCheckedChange={() => toggleTeamMemberSelection(member.name)}
                          />
                        </TableCell>
                        <TableCell>{member.name}</TableCell>
                      </TableRow>
                    ))}
                    {teamMembers.length === 0 && !teamLoading && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No team members found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <Card className="shadow-soft bg-card/95 dark:bg-card/98">
              <CardHeader>
                <CardTitle>Clients</CardTitle>
                <CardDescription>
                  {clientsLoading ? 'Loading...' : `Found ${clients.length} client(s)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedClients.size === clients.length && clients.length > 0}
                          onCheckedChange={toggleAllClients}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.name}>
                        <TableCell>
                          <Checkbox
                            checked={selectedClients.has(client.name)}
                            onCheckedChange={() => toggleClientSelection(client.name)}
                          />
                        </TableCell>
                        <TableCell>{client.name}</TableCell>
                        <TableCell>
                          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                            {client.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {clients.length === 0 && !clientsLoading && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No clients found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card className="shadow-soft bg-card/95 dark:bg-card/98">
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>
                  {tasksLoading ? 'Loading...' : `Found ${tasks.length} task(s)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedTasks.size === tasks.length && tasks.length > 0}
                            onCheckedChange={toggleAllTasks}
                          />
                        </TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/70"
                          onClick={() => handleSort('status')}
                        >
                          Status{renderSortIcon('status')}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/70"
                          onClick={() => handleSort('clientName')}
                        >
                          Client{renderSortIcon('clientName')}
                        </TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/70"
                          onClick={() => handleSort('dueDate')}
                        >
                          Due Date{renderSortIcon('dueDate')}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/70"
                          onClick={() => handleSort('completionDate')}
                        >
                          Completion Date{renderSortIcon('completionDate')}
                        </TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/70"
                          onClick={() => handleSort('subType')}
                        >
                          Task Sub Type{renderSortIcon('subType')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getSortedTasks(tasks).map((task, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Checkbox
                              checked={selectedTasks.has(index)}
                              onCheckedChange={() => toggleTaskSelection(index)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>{getTaskTypeLabel(task.taskType)}</TableCell>
                          <TableCell>
                            <Badge variant={getTaskStatusVariant(task.status)}>
                              {getTaskStatusLabel(task.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{task.clientName}</TableCell>
                          <TableCell>{task.assignedName}</TableCell>
                          <TableCell>{formatDate(task.dueDate)}</TableCell>
                          <TableCell>{formatDate(task.completionDate)}</TableCell>
                          <TableCell>
                            <Badge variant={getPaymentStatusVariant(task.paymentStatus)}>
                              {getPaymentStatusLabel(task.paymentStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell>{task.subType || '—'}</TableCell>
                        </TableRow>
                      ))}
                      {tasks.length === 0 && !tasksLoading && (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center text-muted-foreground">
                            No tasks found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasksByAssignee">
            <Card className="shadow-soft bg-card/95 dark:bg-card/98">
              <CardHeader>
                <CardTitle>Tasks by Assignee</CardTitle>
                <CardDescription>
                  {tasksByAssigneeLoading ? 'Loading...' : `Found ${tasksByAssignee.length} task(s)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedTasks.size === tasksByAssignee.length && tasksByAssignee.length > 0}
                            onCheckedChange={toggleAllTasks}
                          />
                        </TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/70"
                          onClick={() => handleSort('status')}
                        >
                          Status{renderSortIcon('status')}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/70"
                          onClick={() => handleSort('clientName')}
                        >
                          Client{renderSortIcon('clientName')}
                        </TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/70"
                          onClick={() => handleSort('dueDate')}
                        >
                          Due Date{renderSortIcon('dueDate')}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/70"
                          onClick={() => handleSort('completionDate')}
                        >
                          Completion Date{renderSortIcon('completionDate')}
                        </TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/70"
                          onClick={() => handleSort('taskSubType')}
                        >
                          Task Sub Type{renderSortIcon('taskSubType')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getSortedTasksByAssignee(tasksByAssignee).map((task, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Checkbox
                              checked={selectedTasks.has(index)}
                              onCheckedChange={() => toggleTaskSelection(index)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>{getTaskTypeLabel(task.taskType)}</TableCell>
                          <TableCell>
                            <Badge variant={getTaskStatusVariant(task.status)}>
                              {getTaskStatusLabel(task.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{task.clientName}</TableCell>
                          <TableCell>{task.assignedName}</TableCell>
                          <TableCell>{formatDate(task.dueDate)}</TableCell>
                          <TableCell>{formatDate(task.completionDate)}</TableCell>
                          <TableCell>
                            <Badge variant={getPaymentStatusVariant(task.paymentStatus)}>
                              {getPaymentStatusLabel(task.paymentStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell>{getTaskTypeLabel(task.taskSubType)}</TableCell>
                        </TableRow>
                      ))}
                      {tasksByAssignee.length === 0 && !tasksByAssigneeLoading && (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center text-muted-foreground">
                            No tasks found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
