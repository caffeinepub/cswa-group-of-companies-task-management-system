import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Client, Task, TeamMember, TeamMemberData, UserProfile, Type__2, Type__3, TaskFilter, Time, RevenueCardType, RevenueResponse, RevenueModalResponse, DueDateDayType, DueDateModalResponse, DueDateCountResponse, DashboardTasksRequest, DashboardTasksResponse, DateSearchResult, ToDoItem, ToDoItemCreate, ToDoItemUpdate, ToDoFilterType, ToDoAuthRequest, PublicSearchFilter, PublicTeamMember, PublicClient, PublicTask, PublicTaskByAssignee } from '../backend';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// Public Search Queries (No Authentication Required)
export function usePublicSearchTeamMembers(searchTerm: string) {
  const { actor } = useActor();

  return useQuery<PublicTeamMember[]>({
    queryKey: ['publicSearch', 'teamMembers', searchTerm],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!searchTerm || searchTerm.trim().length === 0) return [];
      const filter: PublicSearchFilter = { searchTerm: searchTerm.trim() };
      return actor.publicSearchTeamMembers(filter);
    },
    enabled: !!actor && searchTerm.trim().length > 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function usePublicSearchClients(searchTerm: string) {
  const { actor } = useActor();

  return useQuery<PublicClient[]>({
    queryKey: ['publicSearch', 'clients', searchTerm],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!searchTerm || searchTerm.trim().length === 0) return [];
      const filter: PublicSearchFilter = { searchTerm: searchTerm.trim() };
      return actor.publicSearchClients(filter);
    },
    enabled: !!actor && searchTerm.trim().length > 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function usePublicSearchTasks(searchTerm: string) {
  const { actor } = useActor();

  return useQuery<PublicTask[]>({
    queryKey: ['publicSearch', 'tasks', searchTerm],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!searchTerm || searchTerm.trim().length === 0) return [];
      const filter: PublicSearchFilter = { searchTerm: searchTerm.trim() };
      return actor.publicSearchTasks(filter);
    },
    enabled: !!actor && searchTerm.trim().length > 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function usePublicSearchTasksByAssignee(searchTerm: string) {
  const { actor } = useActor();

  return useQuery<PublicTaskByAssignee[]>({
    queryKey: ['publicSearch', 'tasksByAssignee', searchTerm],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!searchTerm || searchTerm.trim().length === 0) return [];
      const filter: PublicSearchFilter = { searchTerm: searchTerm.trim() };
      return actor.publicSearchTasksByAssignee(filter);
    },
    enabled: !!actor && searchTerm.trim().length > 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Client Queries
export function useGetClients() {
  const { actor, isFetching } = useActor();

  return useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getClients();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchClients(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Client[]>({
    queryKey: ['clients', 'search', searchTerm],
    queryFn: async () => {
      if (!actor) return [];
      if (!searchTerm) return actor.getClients();
      return actor.searchClients(searchTerm);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddClients() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clients: Client[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addClients(clients);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Clients added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add clients: ${error.message}`);
    },
  });
}

export function useBulkImportClients() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clients: Client[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.bulkImportClients(clients);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Clients imported successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to import clients: ${error.message}`);
    },
  });
}

export function useUpdateClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, client }: { clientId: number; client: Client }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateClient(clientId, client);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Client updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update client: ${error.message}`);
    },
  });
}

export function useUpdateClients() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientIds, clients }: { clientIds: number[]; clients: Client[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateClients(new Uint32Array(clientIds), clients);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`${variables.clientIds.length} client(s) updated successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update clients: ${error.message}`);
    },
  });
}

export function useDeleteClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: number) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteClient(clientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Client deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete client: ${error.message}`);
    },
  });
}

export function useDeleteClients() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientIds: number[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteClients(new Uint32Array(clientIds));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`${variables.length} client(s) deleted successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete clients: ${error.message}`);
    },
  });
}

// Task Queries
export function useGetTasks() {
  const { actor, isFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTasks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTasksByStatus(status: Type__2) {
  const { actor, isFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ['tasks', 'status', status],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTasksByStatus(status);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTasksByType(taskType: Type__3) {
  const { actor, isFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ['tasks', 'type', taskType],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTasksByType(taskType);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFilterTasks(filter: TaskFilter) {
  const { actor, isFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ['tasks', 'filter', filter],
    queryFn: async () => {
      if (!actor) return [];
      return actor.filterTasks(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFilterAndSortByClientName(filter: TaskFilter, ascending: boolean, enabled: boolean) {
  const { actor, isFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ['tasks', 'filter', 'sortByClientName', filter, ascending],
    queryFn: async () => {
      if (!actor) return [];
      return actor.filterAndSortByClientName(filter, ascending);
    },
    enabled: !!actor && !isFetching && enabled,
  });
}

export function useSearchTasksByDate(date: Time, enabled: boolean) {
  const { actor, isFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ['tasks', 'dateSearch', date.toString()],
    queryFn: async () => {
      if (!actor) return [];
      const result: DateSearchResult = await actor.searchTasksByDate(date);
      return result.tasks;
    },
    enabled: !!actor && !isFetching && enabled,
  });
}

export function useGetTasksForExport() {
  const { actor, isFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ['tasks', 'export'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTasksForExport();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSelectedTasksForExport(selectedTaskIds: number[]) {
  const { actor, isFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ['tasks', 'export', 'selected', selectedTaskIds],
    queryFn: async () => {
      if (!actor) return [];
      if (selectedTaskIds.length === 0) return [];
      return actor.getSelectedTasksForExport(new Uint32Array(selectedTaskIds));
    },
    enabled: false, // Manual refetch only
  });
}

export function useCreateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Task) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTask(task);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['dueDate'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });
}

export function useBulkImportTasks() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tasks: Task[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.bulkImportTasks(tasks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['dueDate'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Tasks imported successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to import tasks: ${error.message}`);
    },
  });
}

export function useUpdateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, task }: { taskId: number; task: Task }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTask(taskId, task);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['dueDate'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });
}

export function useUpdateTasks() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskIds, tasks }: { taskIds: number[]; tasks: Task[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTasks(new Uint32Array(taskIds), tasks);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['dueDate'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`${variables.taskIds.length} task(s) updated successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update tasks: ${error.message}`);
    },
  });
}

export function useUpdateTaskStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: Type__2 }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTaskStatus(taskId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update task status: ${error.message}`);
    },
  });
}

export function useUpdateTaskComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, comment }: { taskId: number; comment: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTaskComment(taskId, comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Comment updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update comment: ${error.message}`);
    },
  });
}

export function useDeleteTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: number) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['dueDate'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });
}

export function useDeleteTasks() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskIds: number[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTasks(new Uint32Array(taskIds));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['dueDate'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`${variables.length} task(s) deleted successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete tasks: ${error.message}`);
    },
  });
}

export function useAssignTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, assignedTo, assignedName }: { taskId: number; assignedTo: Principal; assignedName: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignTask(taskId, assignedTo, assignedName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign task: ${error.message}`);
    },
  });
}

// Team Member Queries
export function useGetAllTeamMembers() {
  const { actor, isFetching } = useActor();

  return useQuery<TeamMember[]>({
    queryKey: ['teamMembers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTeamMembers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTeamMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, principal }: { name: string; principal: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTeamMember(name, principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success('Team member added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add team member: ${error.message}`);
    },
  });
}

export function useBulkImportTeamMembers() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamMembers: TeamMemberData[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.bulkImportTeamMembers(teamMembers);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success(`${variables.length} team member(s) imported successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to import team members: ${error.message}`);
    },
  });
}

// Revenue Queries
export function useGetRevenueCardsData() {
  const { actor, isFetching } = useActor();

  return useQuery<RevenueResponse>({
    queryKey: ['revenue', 'cards'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getRevenueCardsData();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetRevenueModalData(cardType: RevenueCardType | null) {
  const { actor, isFetching } = useActor();

  return useQuery<RevenueModalResponse>({
    queryKey: ['revenue', 'modal', cardType],
    queryFn: async () => {
      if (!actor || !cardType) throw new Error('Actor or card type not available');
      return actor.getRevenueModalData(cardType);
    },
    enabled: !!actor && !isFetching && cardType !== null,
  });
}

// Helper function to serialize DueDateDayType for query keys
function serializeDueDateDayType(dayType: DueDateDayType | null): string {
  if (!dayType) return 'null';
  
  switch (dayType.__kind__) {
    case 'dueToday':
      return 'dueToday';
    case 'dueTomorrow':
      return 'dueTomorrow';
    case 'anyDate':
      return 'anyDate';
    case 'customDate':
      return `customDate:${dayType.customDate.toString()}`;
    default:
      return 'unknown';
  }
}

// Due Date Queries - Updated to use DueDateCountResponse
export function useGetDueDateCardCounts() {
  const { actor, isFetching } = useActor();

  return useQuery<DueDateCountResponse>({
    queryKey: ['dueDate', 'counts'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getDueDateCardCounts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDueDateModalData(dayType: DueDateDayType | null) {
  const { actor, isFetching } = useActor();

  return useQuery<DueDateModalResponse | null>({
    queryKey: ['dueDate', 'modal', serializeDueDateDayType(dayType)],
    queryFn: async () => {
      if (!actor || !dayType) throw new Error('Actor or day type not available');
      return actor.getDueDateModalData(dayType, null);
    },
    enabled: !!actor && !isFetching && dayType !== null,
  });
}

// Dashboard Tasks Query
export function useGetDashboardTasks(request: DashboardTasksRequest) {
  const { actor, isFetching } = useActor();

  return useQuery<DashboardTasksResponse>({
    queryKey: ['dashboard', 'tasks', request.dueDateSortDirection, request.completionDateSortDirection],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getDashboardTasks(request);
    },
    enabled: !!actor && !isFetching,
  });
}

// To-Do List Queries
export function useGetUserToDos() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ToDoItem[]>({
    queryKey: ['todos', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getUserToDos(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useFilterToDosByUser(filterType: ToDoFilterType) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ToDoItem[]>({
    queryKey: ['todos', 'filter', identity?.getPrincipal().toString(), filterType],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.filterToDosByUser(identity.getPrincipal(), filterType);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAddToDoItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (toDoItem: ToDoItemCreate) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addToDoItem(toDoItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast.success('To-do item added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add to-do item: ${error.message}`);
    },
  });
}

export function useUpdateToDoItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ request, updatedToDoItem }: { request: ToDoAuthRequest; updatedToDoItem: ToDoItemUpdate }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateToDoItem(request, updatedToDoItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast.success('To-do item updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update to-do item: ${error.message}`);
    },
  });
}

export function useDeleteToDoItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ToDoAuthRequest) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteToDoItem(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast.success('To-do item deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete to-do item: ${error.message}`);
    },
  });
}

export function useGetToDosForExport() {
  const { actor, isFetching } = useActor();

  return useQuery<ToDoItem[]>({
    queryKey: ['todos', 'export'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getToDosForExport();
    },
    enabled: !!actor && !isFetching,
  });
}
