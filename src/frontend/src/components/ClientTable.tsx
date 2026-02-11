import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, Pencil, Trash2, Eye, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteClient, useDeleteClients, useIsCallerAdmin } from '../hooks/useQueries';
import type { Client } from '../backend';
import { Type__4 } from '../backend';
import EditClientDialog from './EditClientDialog';
import BulkEditClientsDialog from './BulkEditClientsDialog';
import ViewClientTasksDialog from './ViewClientTasksDialog';
import CreateTaskDialog from './CreateTaskDialog';
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

interface ClientTableProps {
  clients: Client[];
}

export default function ClientTable({ clients }: ClientTableProps) {
  const { data: isAdmin } = useIsCallerAdmin();
  const deleteClient = useDeleteClient();
  const deleteClients = useDeleteClients();
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [selectedClients, setSelectedClients] = useState<Set<number>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [addingTaskForClient, setAddingTaskForClient] = useState<string | null>(null);

  const handleDelete = () => {
    if (deletingClient) {
      deleteClient.mutate(deletingClient.id);
      setDeletingClient(null);
    }
  };

  const handleBulkDelete = () => {
    const clientIds = Array.from(selectedClients);
    deleteClients.mutate(clientIds, {
      onSuccess: () => {
        setSelectedClients(new Set());
        setShowBulkDelete(false);
      },
    });
  };

  const toggleSelectAll = () => {
    if (selectedClients.size === clients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(clients.map((c) => c.id)));
    }
  };

  const toggleSelectClient = (clientId: number) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
  };

  const selectedClientObjects = clients.filter((c) => selectedClients.has(c.id));

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No clients found. Add your first client to get started.</p>
      </div>
    );
  }

  return (
    <>
      {isAdmin && selectedClients.size > 0 && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedClients.size} client(s) selected</span>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {isAdmin && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedClients.size === clients.length && clients.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all clients"
                  />
                </TableHead>
              )}
              <TableHead>Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                {isAdmin && (
                  <TableCell>
                    <Checkbox
                      checked={selectedClients.has(client.id)}
                      onCheckedChange={() => toggleSelectClient(client.id)}
                      aria-label={`Select ${client.name}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.contactInfo}</TableCell>
                <TableCell>
                  <Badge variant={client.status === Type__4.active ? 'default' : 'secondary'}>
                    {client.status === Type__4.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewingClient(client)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Tasks
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => setAddingTaskForClient(client.name)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Task
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingClient(client)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingClient(client)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingClient && <EditClientDialog client={editingClient} open={true} onOpenChange={() => setEditingClient(null)} />}
      {viewingClient && <ViewClientTasksDialog client={viewingClient} open={true} onOpenChange={() => setViewingClient(null)} />}
      {addingTaskForClient && (
        <CreateTaskDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setAddingTaskForClient(null);
          }}
          initialClientName={addingTaskForClient}
        />
      )}
      {showBulkEdit && (
        <BulkEditClientsDialog
          clients={selectedClientObjects}
          open={showBulkEdit}
          onOpenChange={(open) => {
            setShowBulkEdit(open);
            if (!open) setSelectedClients(new Set());
          }}
        />
      )}

      <AlertDialog open={!!deletingClient} onOpenChange={() => setDeletingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingClient?.name}"? This action cannot be undone.
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
            <AlertDialogTitle>Delete Multiple Clients</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedClients.size} client(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowBulkDelete(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={deleteClients.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteClients.isPending ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
