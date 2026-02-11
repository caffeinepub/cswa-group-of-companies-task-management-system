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
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-sidebar border-r border-sidebar-border overflow-hidden flex flex-col shadow-soft-lg`}
      >
        <div className="p-6 border-b border-sidebar-border bg-gradient-to-br from-sidebar to-sidebar/95">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 p-2 ring-2 ring-primary/20">
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
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-soft font-medium'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border bg-sidebar/50">
          <div className="mb-3 px-2">
            <p className="text-sm font-semibold text-sidebar-foreground">{userProfile?.name}</p>
            <p className="text-xs text-sidebar-foreground/60 mt-0.5">{isAdmin ? 'Administrator' : 'User'}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="w-full justify-start border-sidebar-border hover:bg-sidebar-accent" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-soft">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="hover:bg-accent">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 p-2 ring-2 ring-primary/20">
                <img src="/assets/image-2.png" alt="CSWA Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground tracking-tight">CSWA Group of Companies</h2>
                <p className="text-xs text-muted-foreground capitalize">{currentPage === 'todo' ? 'To-Do List' : currentPage}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-background">{renderPage()}</main>

        {/* Footer */}
        <footer className="bg-card border-t border-border px-6 py-3 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{' '}
          <a 
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:underline font-medium"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}

