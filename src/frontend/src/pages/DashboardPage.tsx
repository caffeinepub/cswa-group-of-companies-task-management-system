import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetClients, useFilterTasks, useGetAllTeamMembers, useGetTasksForExport, useGetRevenueCardsData } from '../hooks/useQueries';
import { Users, CheckSquare, Clock, CheckCircle2, AlertCircle, UserCog, FileDown, TrendingUp, BarChart3, FileText, Briefcase, Building2, ClipboardList, FileCheck, FolderOpen, DollarSign, Wallet, CreditCard } from 'lucide-react';
import { Type__2, Type__3, Type__4, RevenueCardType } from '../backend';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ClientTable from '../components/ClientTable';
import TaskList from '../components/TaskList';
import RevenueDetailModal from '../components/RevenueDetailModal';
import { exportTasksToExcel } from '../lib/excelTemplates';
import { cn } from '@/lib/utils';

type ExpandedSection = 'clients' | 'tasks' | 'pending' | 'inProgress' | 'completed' | 'team' | null;
type TaskTypeFilter = Type__3 | 'all';

export default function DashboardPage() {
  const { data: clients = [], isLoading: clientsLoading } = useGetClients();
  const { data: allTasks = [] } = useFilterTasks({});
  const { data: exportTasks = [] } = useGetTasksForExport();
  const { data: teamMembers = [] } = useGetAllTeamMembers();
  const { data: revenueData } = useGetRevenueCardsData();
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskTypeFilter>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [selectedRevenueCard, setSelectedRevenueCard] = useState<RevenueCardType | null>(null);

  // Categorize tasks by status
  const pendingTasks = allTasks.filter((t) => t.status === Type__2.pending);
  const inProgressTasks = allTasks.filter((t) => t.status === Type__2.inProgress);
  const completedTasks = allTasks.filter((t) => t.status === Type__2.completed);

  const totalTasks = allTasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

  const activeClients = clients.filter((c) => c.status === Type__4.active).length;
  const inactiveClients = clients.filter((c) => c.status === Type__4.inactive).length;

  // Use backend revenue data
  const revenueMetrics = useMemo(() => {
    if (!revenueData) {
      return {
        totalRevenue: 0,
        totalCollected: 0,
        totalOutstanding: 0,
      };
    }
    return {
      totalRevenue: Number(revenueData.totalRevenue),
      totalCollected: Number(revenueData.totalCollected),
      totalOutstanding: Number(revenueData.totalOutstanding),
    };
  }, [revenueData]);

  // Task type breakdown with icons
  const taskTypeData = [
    { type: Type__3.GST, label: 'GST', icon: FileText, count: allTasks.filter((t) => t.taskType === Type__3.GST).length, color: 'text-blue-500' },
    { type: Type__3.Audit, label: 'Audit', icon: ClipboardList, count: allTasks.filter((t) => t.taskType === Type__3.Audit).length, color: 'text-purple-500' },
    { type: Type__3.ITNotice, label: 'IT Notice', icon: AlertCircle, count: allTasks.filter((t) => t.taskType === Type__3.ITNotice).length, color: 'text-red-500' },
    { type: Type__3.TDS, label: 'TDS', icon: Briefcase, count: allTasks.filter((t) => t.taskType === Type__3.TDS).length, color: 'text-green-500' },
    { type: Type__3.Accounts, label: 'Accounts', icon: BarChart3, count: allTasks.filter((t) => t.taskType === Type__3.Accounts).length, color: 'text-amber-500' },
    { type: Type__3.FormFiling, label: 'Form Filing', icon: FileCheck, count: allTasks.filter((t) => t.taskType === Type__3.FormFiling).length, color: 'text-cyan-500' },
    { type: Type__3.CACertificate, label: 'CA Certificate', icon: Building2, count: allTasks.filter((t) => t.taskType === Type__3.CACertificate).length, color: 'text-indigo-500' },
    { type: Type__3.Other, label: 'Others', icon: FolderOpen, count: allTasks.filter((t) => t.taskType === Type__3.Other).length, color: 'text-gray-500' },
  ];

  // Filter tasks by selected type
  const filteredTasksByType = taskTypeFilter === 'all' 
    ? allTasks 
    : allTasks.filter((t) => t.taskType === taskTypeFilter);

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

  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection(expandedSection === section ? null : section);
    if (section !== expandedSection) {
      setTaskTypeFilter('all');
    }
  };

  const handleTaskTypeClick = (type: Type__3) => {
    setTaskTypeFilter(type);
    setExpandedSection('tasks');
  };

  const handleExportTasks = () => {
    try {
      setIsExporting(true);
      if (exportTasks.length === 0) {
        toast.error('No tasks available to export');
        return;
      }
      exportTasksToExcel(exportTasks);
      toast.success(`Successfully exported ${exportTasks.length} task(s) to Excel`);
    } catch (error) {
      toast.error('Failed to export tasks: ' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRevenueCardClick = (cardType: RevenueCardType) => {
    setSelectedRevenueCard(cardType);
    setRevenueModalOpen(true);
  };

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground text-lg">Monitor your consultancy's performance and task progress</p>
        </div>
        <Button onClick={handleExportTasks} disabled={isExporting || exportTasks.length === 0} size="lg" className="shadow-soft">
          <FileDown className="h-5 w-5 mr-2" />
          {isExporting ? 'Exporting...' : 'Export All Tasks'}
        </Button>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          className="cursor-pointer hover:shadow-soft-lg transition-all duration-200 border-l-4 border-l-primary bg-gradient-to-br from-card to-card/95"
          onClick={() => handleRevenueCardClick(RevenueCardType.totalRevenue)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Revenue</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">₹{revenueMetrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">Total billed amount across all tasks</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-soft-lg transition-all duration-200 border-l-4 border-l-green-500 bg-gradient-to-br from-card to-card/95"
          onClick={() => handleRevenueCardClick(RevenueCardType.totalCollected)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Collected</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">₹{revenueMetrics.totalCollected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">Total advance payments received</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-soft-lg transition-all duration-200 border-l-4 border-l-amber-500 bg-gradient-to-br from-card to-card/95"
          onClick={() => handleRevenueCardClick(RevenueCardType.totalOutstanding)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Outstanding Balance</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">₹{revenueMetrics.totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">Pending payments to be collected</p>
          </CardContent>
        </Card>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          className="cursor-pointer hover:shadow-soft-lg transition-all duration-200 bg-gradient-to-br from-card to-card/95"
          onClick={() => toggleSection('clients')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Clients</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{clients.length}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="default" className="text-xs">{activeClients} Active</Badge>
              <Badge variant="secondary" className="text-xs">{inactiveClients} Inactive</Badge>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-soft-lg transition-all duration-200 bg-gradient-to-br from-card to-card/95"
          onClick={() => toggleSection('tasks')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Tasks</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <CheckSquare className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalTasks}</div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Completion Rate</span>
                <span className="font-semibold">{completionRate.toFixed(0)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-soft-lg transition-all duration-200 bg-gradient-to-br from-card to-card/95"
          onClick={() => toggleSection('pending')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Pending Tasks</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{pendingTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-2">Tasks awaiting action</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-soft-lg transition-all duration-200 bg-gradient-to-br from-card to-card/95"
          onClick={() => toggleSection('team')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Team Members</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground mt-2">Active team members</p>
          </CardContent>
        </Card>
      </div>

      {/* Task Type Breakdown */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Task Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {taskTypeData.map((taskType) => {
              const Icon = taskType.icon;
              return (
                <button
                  key={taskType.type}
                  onClick={() => handleTaskTypeClick(taskType.type)}
                  className="flex flex-col items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:shadow-soft transition-all duration-200 bg-card"
                >
                  <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center", `bg-${taskType.color.split('-')[1]}-500/10`)}>
                    <Icon className={cn("h-6 w-6", taskType.color)} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">{taskType.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{taskType.count}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Expanded Sections */}
      {expandedSection === 'clients' && (
        <Card className="shadow-soft-lg animate-scale-in">
          <CardHeader>
            <CardTitle className="text-xl font-bold">All Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientTable clients={clients} />
          </CardContent>
        </Card>
      )}

      {expandedSection === 'tasks' && (
        <Card className="shadow-soft-lg animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold">
              {taskTypeFilter === 'all' ? 'All Tasks' : `${taskTypeData.find(t => t.type === taskTypeFilter)?.label} Tasks`}
            </CardTitle>
            {taskTypeFilter !== 'all' && (
              <Button variant="outline" size="sm" onClick={() => setTaskTypeFilter('all')}>
                Clear Filter
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <TaskList tasks={filteredTasksByType} />
          </CardContent>
        </Card>
      )}

      {expandedSection === 'pending' && (
        <Card className="shadow-soft-lg animate-scale-in">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList tasks={pendingTasks} />
          </CardContent>
        </Card>
      )}

      {expandedSection === 'inProgress' && (
        <Card className="shadow-soft-lg animate-scale-in">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              In Progress Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList tasks={inProgressTasks} />
          </CardContent>
        </Card>
      )}

      {expandedSection === 'completed' && (
        <Card className="shadow-soft-lg animate-scale-in">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Completed Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList tasks={completedTasks} />
          </CardContent>
        </Card>
      )}

      {expandedSection === 'team' && (
        <Card className="shadow-soft-lg animate-scale-in">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => (
                <div key={member.principal.toString()} className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:shadow-soft transition-all duration-200">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                    <UserCog className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{member.name}</p>
                    <Badge variant="secondary" className="text-xs mt-1">Team Member</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Detail Modal */}
      {selectedRevenueCard && (
        <RevenueDetailModal
          open={revenueModalOpen}
          onOpenChange={setRevenueModalOpen}
          cardType={selectedRevenueCard}
        />
      )}
    </div>
  );
}

