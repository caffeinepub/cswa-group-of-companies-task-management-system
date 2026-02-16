import { useState } from 'react';
import { LayoutDashboard, Users, CheckSquare, UserCog, Menu, LogOut, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import DashboardPage from '../pages/DashboardPage';
import ClientsPage from '../pages/ClientsPage';
import TasksPage from '../pages/TasksPage';
import TeamPage from '../pages/TeamPage';
import ToDoPage from '../pages/ToDoPage';

type Page = 'dashboard' | 'clients' | 'tasks' | 'team' | 'todo';

export default function MainLayout() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const navItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients' as Page, label: 'Clients', icon: Users },
    { id: 'tasks' as Page, label: 'Tasks', icon: CheckSquare },
    { id: 'todo' as Page, label: 'To-Do List', icon: ListTodo },
    { id: 'team' as Page, label: 'Team', icon: UserCog },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'clients':
        return <ClientsPage />;
      case 'tasks':
        return <TasksPage />;
      case 'todo':
        return <ToDoPage />;
      case 'team':
        return <TeamPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 dark:from-primary/3 dark:via-background dark:to-accent/5 relative overflow-hidden">
      {/* Decorative background elements - reduced opacity in dark mode */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/8 to-transparent dark:from-primary/4 dark:to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-accent/8 to-transparent dark:from-accent/4 dark:to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-gradient-to-br from-secondary/6 to-transparent dark:from-secondary/3 dark:to-transparent rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-gradient-to-b from-sidebar via-sidebar/98 to-sidebar/95 dark:from-sidebar dark:via-sidebar dark:to-sidebar/98 border-r border-sidebar-border overflow-hidden flex flex-col shadow-colorful relative z-10 backdrop-blur-sm`}
      >
        <div className="p-6 border-b border-sidebar-border bg-gradient-to-br from-primary/8 via-accent/5 to-transparent dark:from-primary/4 dark:via-accent/3 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/25 to-accent/25 dark:from-primary/20 dark:to-accent/20 p-2.5 ring-2 ring-primary/40 dark:ring-primary/30 shadow-soft">
              <img src="/assets/image-2.png" alt="CSWA Logo" className="h-full w-full object-contain" />
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight">CSWA Group of Companies</h1>
            <p className="text-xs text-sidebar-foreground/60 mt-0.5">Task Management System</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-sidebar-primary to-sidebar-primary/90 dark:from-sidebar-primary dark:to-sidebar-primary/95 text-sidebar-primary-foreground shadow-soft font-medium scale-[1.02]'
                    : 'text-sidebar-foreground/70 hover:bg-gradient-to-r hover:from-accent/20 hover:to-accent/10 dark:hover:from-accent/15 dark:hover:to-accent/8 hover:text-sidebar-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border bg-gradient-to-br from-primary/5 via-transparent to-accent/5 dark:from-primary/3 dark:via-transparent dark:to-accent/3">
          <div className="mb-3 px-2">
            <p className="text-xs font-medium text-sidebar-foreground">{userProfile?.name || 'User'}</p>
            <p className="text-xs text-sidebar-foreground/50">{isAdmin ? 'Admin' : 'User'}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start border-sidebar-border hover:bg-destructive/20 dark:hover:bg-destructive/15 hover:text-destructive hover:border-destructive/50 transition-all"
            size="sm"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <header className="bg-card/80 dark:bg-card/90 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between shadow-soft">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-accent/20 dark:hover:bg-accent/15"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold text-foreground capitalize">{currentPage}</h2>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
