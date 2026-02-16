import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PublicTaskByAssignee {
    status: Type__2;
    title: string;
    paymentStatus: Type;
    completionDate?: Time;
    clientName: string;
    dueDate?: Time;
    taskStatus: Type__2;
    taskType: Type__3;
    comment?: string;
    assignedDate?: Time;
    assignedName: string;
    taskSubType: Type__3;
}
export type Time = bigint;
export interface DueDateModalResponse {
    taskCount: bigint;
    items: Array<DueDateTaskDetails>;
}
export type DueDateDayType = {
    __kind__: "dueTomorrow";
    dueTomorrow: null;
} | {
    __kind__: "dueToday";
    dueToday: null;
} | {
    __kind__: "anyDate";
    anyDate: null;
} | {
    __kind__: "customDate";
    customDate: Time;
};
export interface DueDateCountResponse {
    dueTodayCount: bigint;
    dueTomorrowCount: bigint;
    customDateCount: bigint;
    anyDateCount: bigint;
}
export interface Task {
    id: number;
    status: Type__2;
    title: string;
    clientId: number;
    paymentStatus: Type;
    subType?: string;
    completionDate?: Time;
    assignedTo: Principal;
    clientName: string;
    assignmentDate?: Time;
    bill?: string;
    advanceReceived?: bigint;
    createdAt: Time;
    recurring: Type__1;
    dueDate?: Time;
    manualAssignmentDate?: Time;
    taskType: Type__3;
    comment?: string;
    outstandingAmount?: bigint;
    captains: Array<Principal>;
    assignedName: string;
}
export interface RevenueTaskDetails {
    paymentStatus: Type;
    clientName: string;
    bill?: string;
    advanceReceived?: bigint;
    taskName: string;
    outstandingAmount?: bigint;
}
export interface DashboardTasksResponse {
    completionDateSorted: Array<Task>;
    dueDateSorted: Array<Task>;
}
export interface ToDoItemUpdate {
    title: string;
    completed: boolean;
    dueDate?: Time;
    description?: string;
}
export interface PublicClient {
    status: Type__4;
    name: string;
}
export interface DashboardTasksRequest {
    completionDateSortDirection: SortDirection;
    dueDateSortDirection: SortDirection;
}
export interface PublicSearchFilter {
    searchTerm: string;
}
export interface DateSearchResult {
    tasks: Array<Task>;
    date: Time;
}
export interface Client {
    id: number;
    pan?: string;
    status: Type__4;
    subCategory?: string;
    contactInfo: string;
    name: string;
    recurring: Type__1;
    gstin?: string;
    taskCategory: Type__3;
}
export interface ToDoItemCreate {
    title: string;
    dueDate?: Time;
    description?: string;
}
export interface RevenueResponse {
    totalCollected: bigint;
    totalOutstanding: bigint;
    totalRevenue: bigint;
}
export interface ToDoItem {
    id: number;
    title: string;
    owner: ToDoItemOwner;
    modifiedAt: Time;
    createdAt: Time;
    completed: boolean;
    dueDate?: Time;
    description?: string;
}
export interface PublicTask {
    status: Type__2;
    title: string;
    paymentStatus: Type;
    subType?: string;
    completionDate?: Time;
    clientName: string;
    dueDate?: Time;
    taskType: Type__3;
    comment?: string;
    assignedDate?: Time;
    assignedName: string;
    taskSubType: Type__3;
}
export interface TeamMemberData {
    principal: Principal;
    name: string;
}
export interface PublicTeamMember {
    name: string;
}
export type TaskId = number;
export interface RevenueModalResponse {
    totalAmount: bigint;
    items: Array<RevenueTaskDetails>;
}
export interface TeamMember {
    principal: Principal;
    name: string;
}
export type ToDoItemOwner = Principal;
export interface TaskFilter {
    status?: Type__2;
    paymentStatus?: Type;
    subType?: string;
    assigneeName?: string;
    searchTerm?: string;
    taskType?: Type__3;
    comment?: string;
}
export interface DueDateTaskDetails {
    status: Type__2;
    assignee: string;
    paymentStatus: Type;
    clientName: string;
    dueDate?: Time;
    taskTitle: string;
    comments?: string;
}
export interface ToDoAuthRequest {
    owner: Principal;
    todoId: number;
}
export interface UserProfile {
    name: string;
    role: string;
}
export enum RevenueCardType {
    totalCollected = "totalCollected",
    totalOutstanding = "totalOutstanding",
    totalRevenue = "totalRevenue"
}
export enum SortDirection {
    asc = "asc",
    desc = "desc"
}
export enum ToDoFilterType {
    all = "all",
    today = "today"
}
export enum Type {
    pending = "pending",
    paid = "paid",
    overdue = "overdue"
}
export enum Type__1 {
    none = "none",
    quarterly = "quarterly",
    monthly = "monthly",
    yearly = "yearly"
}
export enum Type__2 {
    pending = "pending",
    hold = "hold",
    completed = "completed",
    inProgress = "inProgress",
    docsPending = "docsPending"
}
export enum Type__3 {
    GST = "GST",
    TDS = "TDS",
    ITNotice = "ITNotice",
    Accounts = "Accounts",
    Audit = "Audit",
    Other = "Other",
    FormFiling = "FormFiling",
    CACertificate = "CACertificate"
}
export enum Type__4 {
    active = "active",
    inactive = "inactive"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addClients(newClients: Array<Client>): Promise<void>;
    addToDoItem(toDoItem: ToDoItemCreate): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignTask(taskId: number, assignedTo: Principal, assignedName: string): Promise<void>;
    bulkImportClients(clientsToImport: Array<Client>): Promise<void>;
    bulkImportTasks(tasksToImport: Array<Task>): Promise<void>;
    bulkImportTeamMembers(teamMembersToImport: Array<TeamMemberData>): Promise<void>;
    createTask(newTask: Task): Promise<void>;
    createTeamMember(name: string, principal: Principal): Promise<void>;
    deleteClient(clientId: number): Promise<void>;
    deleteClients(clientIds: Uint32Array): Promise<void>;
    deleteTask(taskId: number): Promise<void>;
    deleteTasks(taskIds: Uint32Array): Promise<void>;
    deleteToDoItem(request: ToDoAuthRequest): Promise<void>;
    filterAndSortByClientName(filter: TaskFilter, ascending: boolean): Promise<Array<Task>>;
    filterTasks(params: TaskFilter): Promise<Array<Task>>;
    filterTasksByDate(targetDate: Time, _includeDueDate: boolean, _includeCompletionDate: boolean): Promise<DateSearchResult>;
    filterToDosByUser(user: Principal, filterType: ToDoFilterType): Promise<Array<ToDoItem>>;
    getAllTasksForExport(): Promise<Array<Task>>;
    getAllTeamMembers(): Promise<Array<TeamMember>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClients(): Promise<Array<Client>>;
    getDashboardTasks(request: DashboardTasksRequest): Promise<DashboardTasksResponse>;
    getDueDateCardCounts(): Promise<DueDateCountResponse>;
    getDueDateModalData(dayType: DueDateDayType | null, customDate: Time | null): Promise<DueDateModalResponse | null>;
    getRevenueCardsData(): Promise<RevenueResponse>;
    getRevenueModalData(cardType: RevenueCardType): Promise<RevenueModalResponse>;
    getSelectedTasksForExport(selectedTaskIds: Uint32Array): Promise<Array<Task>>;
    getTasks(): Promise<Array<Task>>;
    getTasksByStatus(status: Type__2): Promise<Array<Task>>;
    getTasksByType(taskType: Type__3): Promise<Array<Task>>;
    getTasksForExport(): Promise<Array<Task>>;
    getToDosForExport(): Promise<Array<ToDoItem>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserToDos(user: Principal): Promise<Array<ToDoItem>>;
    isCallerAdmin(): Promise<boolean>;
    publicSearchClients(filter: PublicSearchFilter): Promise<Array<PublicClient>>;
    publicSearchTasks(filter: PublicSearchFilter): Promise<Array<PublicTask>>;
    publicSearchTasksByAssignee(filter: PublicSearchFilter): Promise<Array<PublicTaskByAssignee>>;
    publicSearchTeamMembers(filter: PublicSearchFilter): Promise<Array<PublicTeamMember>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchClients(searchTerm: string): Promise<Array<Client>>;
    searchTasksByDate(date: Time): Promise<DateSearchResult>;
    updateClient(clientId: number, updatedClient: Client): Promise<void>;
    updateClients(clientIds: Uint32Array, updatedClients: Array<Client>): Promise<void>;
    updatePaymentStatus(taskId: number, paymentStatus: Type, advanceReceived: bigint | null, bill: string | null): Promise<void>;
    updateTask(taskId: number, updatedTask: Task): Promise<void>;
    updateTaskBill(taskId: number, bill: string | null, advanceReceived: bigint | null): Promise<void>;
    updateTaskCaptains(taskId: number, captains: Array<Principal>): Promise<void>;
    updateTaskComment(taskId: number, comment: string | null): Promise<void>;
    updateTaskStatus(taskId: number, status: Type__2): Promise<void>;
    updateTasks(taskIds: Uint32Array, updatedTasks: Array<Task>): Promise<void>;
    updateToDoItem(request: ToDoAuthRequest, updatedToDoItem: ToDoItemUpdate): Promise<void>;
}
