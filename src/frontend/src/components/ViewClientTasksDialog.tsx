import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGetTasks } from '../hooks/useQueries';
import type { Client } from '../backend';
import { Type__2, Type__3 } from '../backend';
import { Badge } from '@/components/ui/badge';
import { CheckSquare } from 'lucide-react';
import { useMemo } from 'react';

interface ViewClientTasksDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ViewClientTasksDialog({ client, open, onOpenChange }: ViewClientTasksDialogProps) {
  const { data: allTasks = [], isLoading } = useGetTasks();

  // Filter tasks by client name on the frontend
  const tasks = useMemo(() => {
    return allTasks.filter(task => task.clientName.toLowerCase() === client.name.toLowerCase());
  }, [allTasks, client.name]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tasks for {client.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="mb-4 h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-sm text-muted-foreground">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No tasks found for this client.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="p-4 bg-accent/50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-foreground">{task.title}</h4>
                  <Badge variant={getStatusVariant(task.status)}>{getStatusLabel(task.status)}</Badge>
                </div>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">{getTaskTypeLabel(task.taskType)}</Badge>
                  {task.subType && (
                    <span className="text-xs text-muted-foreground">• {task.subType}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
