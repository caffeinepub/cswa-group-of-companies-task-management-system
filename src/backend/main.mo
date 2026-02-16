import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Nat32 "mo:core/Nat32";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Char "mo:core/Char";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";


// Apply data migration on upgrade via with clause

actor {
  //----------------------------------------
  // Enums and Types
  //----------------------------------------
  module TaskType {
    public type Type = {
      #GST;
      #Audit;
      #ITNotice;
      #Other;
      #TDS;
      #Accounts;
      #FormFiling;
      #CACertificate;
    };

    public func toText(t : Type) : Text {
      switch (t) {
        case (#GST) { "GST" };
        case (#Audit) { "Audit" };
        case (#ITNotice) { "IT Notice" };
        case (#Other) { "Other" };
        case (#TDS) { "TDS" };
        case (#Accounts) { "Accounts" };
        case (#FormFiling) { "Form Filing" };
        case (#CACertificate) { "CA Certificate" };
      };
    };
  };

  module TaskStatus {
    public type Type = {
      #pending;
      #inProgress;
      #completed;
      #docsPending;
      #hold;
    };

    public func toText(t : Type) : Text {
      switch (t) {
        case (#pending) { "Pending" };
        case (#inProgress) { "In Progress" };
        case (#completed) { "Completed" };
        case (#docsPending) { "Docs Pending" };
        case (#hold) { "Hold" };
      };
    };
  };

  module PaymentStatus {
    public type Type = { #pending; #paid; #overdue };

    public func toText(t : Type) : Text {
      switch (t) {
        case (#pending) { "Pending" };
        case (#paid) { "Paid" };
        case (#overdue) { "Overdue" };
      };
    };
  };

  module TaskRecurring {
    public type Type = {
      #monthly;
      #quarterly;
      #yearly;
      #none;
    };

    public func toText(t : Type) : Text {
      switch (t) {
        case (#monthly) { "Monthly" };
        case (#quarterly) { "Quarterly" };
        case (#yearly) { "Yearly" };
        case (#none) { "None" };
      };
    };
  };

  module ClientStatus {
    public type Type = { #active; #inactive };
  };

  module Client {
    public func compare(client1 : Client, client2 : Client) : Order.Order {
      Nat32.compare(client1.id, client2.id);
    };
  };

  module Task {
    public func compare(task1 : Task, task2 : Task) : Order.Order {
      Nat32.compare(task1.id, task2.id);
    };
  };

  module TeamMember {
    public func compare(teamMember1 : TeamMember, teamMember2 : TeamMember) : Order.Order {
      switch (Text.compare(teamMember1.name, teamMember2.name)) {
        case (#equal) { Principal.compare(teamMember1.principal, teamMember2.principal) };
        case (order) { order };
      };
    };
  };

  module ToDoItem {
    public func compare(todo1 : ToDoItem, todo2 : ToDoItem) : Order.Order {
      Nat32.compare(todo1.id, todo2.id);
    };
  };

  public type Client = {
    id : Nat32;
    name : Text;
    contactInfo : Text;
    status : ClientStatus.Type;
    gstin : ?Text;
    pan : ?Text;
    taskCategory : TaskType.Type;
    subCategory : ?Text;
    recurring : TaskRecurring.Type;
  };

  public type Task = {
    id : Nat32;
    clientId : Nat32;
    clientName : Text;
    title : Text;
    taskType : TaskType.Type;
    status : TaskStatus.Type;
    comment : ?Text;
    assignedTo : Principal;
    assignedName : Text;
    captains : [Principal];
    createdAt : Time.Time;
    recurring : TaskRecurring.Type;
    subType : ?Text;
    bill : ?Text;
    paymentStatus : PaymentStatus.Type;
    dueDate : ?Time.Time;
    assignmentDate : ?Time.Time;
    completionDate : ?Time.Time;
    manualAssignmentDate : ?Time.Time;
    advanceReceived : ?Nat;
    outstandingAmount : ?Nat;
  };

  public type TaskUpdate = {
    clientId : Nat32;
    title : Text;
    taskType : TaskType.Type;
    status : TaskStatus.Type;
    comment : ?Text;
    assignedTo : Principal;
    assignedName : Text;
    recurring : TaskRecurring.Type;
    subType : ?Text;
    bill : ?Text;
    paymentStatus : PaymentStatus.Type;
    dueDate : ?Time.Time;
    assignmentDate : ?Time.Time;
  };

  public type TeamMember = {
    principal : Principal;
    name : Text;
  };

  public type TeamMemberData = {
    name : Text;
    principal : Principal;
  };

  public type UserProfile = {
    name : Text;
    role : Text;
  };

  public type TaskFilter = {
    taskType : ?TaskType.Type;
    assigneeName : ?Text;
    status : ?TaskStatus.Type;
    paymentStatus : ?PaymentStatus.Type;
    subType : ?Text;
    comment : ?Text;
    searchTerm : ?Text;
  };

  public type TaskStatusUpdate = {
    status : TaskStatus.Type;
  };

  public type PaymentDetails = {
    bill : ?Text;
    paymentStatus : PaymentStatus.Type;
    advanceReceived : ?Nat;
    outstandingAmount : ?Nat;
  };

  public type RevenueCardType = {
    #totalRevenue;
    #totalCollected;
    #totalOutstanding;
  };

  public type RevenueResponse = {
    totalRevenue : Nat;
    totalCollected : Nat;
    totalOutstanding : Nat;
  };

  public type RevenueTaskDetails = {
    taskName : Text;
    clientName : Text;
    bill : ?Text;
    advanceReceived : ?Nat;
    outstandingAmount : ?Nat;
    paymentStatus : PaymentStatus.Type;
  };

  public type RevenueModalResponse = {
    totalAmount : Nat;
    items : [RevenueTaskDetails];
  };

  public type DueDateDayType = {
    #anyDate;
    #dueToday;
    #dueTomorrow;
    #customDate : Time.Time;
  };

  public type DueDateTaskDetails = {
    clientName : Text;
    taskTitle : Text;
    assignee : Text;
    status : TaskStatus.Type;
    paymentStatus : PaymentStatus.Type;
    dueDate : ?Time.Time;
    comments : ?Text;
  };

  public type DueDateCountResponse = {
    dueTodayCount : Nat;
    dueTomorrowCount : Nat;
    anyDateCount : Nat;
    customDateCount : Nat;
  };

  public type DueDateModalResponse = {
    taskCount : Nat;
    items : [DueDateTaskDetails];
  };

  public type SortDirection = {
    #asc;
    #desc;
  };

  public type DashboardTasksRequest = {
    dueDateSortDirection : SortDirection;
    completionDateSortDirection : SortDirection;
  };

  public type DashboardTasksResponse = {
    dueDateSorted : [Task];
    completionDateSorted : [Task];
  };

  public type DateSearchResult = {
    date : Time.Time;
    tasks : [Task];
  };

  type ToDoItemOwner = Principal.Principal;

  public type ToDoItem = {
    id : Nat32;
    owner : ToDoItemOwner;
    title : Text;
    description : ?Text;
    dueDate : ?Time.Time;
    completed : Bool;
    createdAt : Time.Time;
    modifiedAt : Time.Time;
  };

  public type ToDoItemCreate = {
    title : Text;
    description : ?Text;
    dueDate : ?Time.Time;
  };

  public type ToDoItemUpdate = {
    title : Text;
    description : ?Text;
    dueDate : ?Time.Time;
    completed : Bool;
  };

  public type ToDoFilterType = { #all; #today };
  public type ToDoAuthRequest = {
    owner : Principal;
    todoId : Nat32;
  };

  public type PublicSearchFilter = {
    searchTerm : Text;
  };

  public type PublicTeamMember = {
    name : Text;
  };

  public type PublicClient = {
    name : Text;
    status : ClientStatus.Type;
  };

  public type PublicTask = {
    title : Text;
    taskType : TaskType.Type;
    status : TaskStatus.Type;
    clientName : Text;
    assignedName : Text;
    dueDate : ?Time.Time;
    completionDate : ?Time.Time;
    comment : ?Text;
    paymentStatus : PaymentStatus.Type;
    subType : ?Text;
    assignedDate : ?Time.Time;
    taskSubType : TaskType.Type;
  };

  public type PublicTaskByAssignee = {
    title : Text;
    taskType : TaskType.Type;
    status : TaskStatus.Type;
    clientName : Text;
    assignedName : Text;
    dueDate : ?Time.Time;
    completionDate : ?Time.Time;
    comment : ?Text;
    paymentStatus : PaymentStatus.Type;
    taskSubType : TaskType.Type;
    assignedDate : ?Time.Time;
    taskStatus : TaskStatus.Type;
  };

  //----------------------------------------
  // State (persistent data)
  //----------------------------------------
  let clients = Map.empty<Nat32, Client>();
  let tasks = Map.empty<Nat32, Task>();
  let teamMembers = Map.empty<Principal, TeamMember>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let toDoItems = Map.empty<Nat32, ToDoItem>();

  var nextClientId = 1 : Nat32;
  var nextTaskId = 1 : Nat32;
  var nextToDoId = 1 : Nat32;

  //----------------------------------------
  // Authorization
  //----------------------------------------
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  //----------------------------------------
  // File Management
  //----------------------------------------
  include MixinStorage();

  //----------------------------------------
  // Public Search Endpoints (REQUIRE Authentication)
  //----------------------------------------
  func containsText(haystack : Text, needle : Text) : Bool {
    let haystackBytes = haystack.toLower().toArray();
    let needleBytes = needle.toLower().toArray();

    func isMatchAt(position : Nat) : Bool {
      var i = 0;
      while (i < needleBytes.size()) {
        if (position + i >= haystackBytes.size() or haystackBytes[position + i] != needleBytes[i]) {
          return false;
        };
        i += 1;
      };
      true;
    };

    func checkPosition(position : Nat) : Bool {
      if (position + needleBytes.size() > haystackBytes.size()) {
        return false;
      };
      if (isMatchAt(position)) {
        return true;
      };
      if (position + 1 < haystackBytes.size()) {
        checkPosition(position + 1);
      } else {
        false;
      };
    };

    checkPosition(0);
  };

  // Public search for team members - requires user authentication
  public query ({ caller }) func publicSearchTeamMembers(filter : PublicSearchFilter) : async [PublicTeamMember] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search team members");
    };

    teamMembers.values().toArray().filter(
      func(member) {
        containsText(member.name, filter.searchTerm);
      }
    ).map(
      func(member) : PublicTeamMember {
        { name = member.name };
      }
    ).sort(
      func(a, b) { Text.compare(a.name, b.name) }
    );
  };

  // Public search for clients - requires user authentication
  public query ({ caller }) func publicSearchClients(filter : PublicSearchFilter) : async [PublicClient] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search clients");
    };

    clients.values().toArray().filter(
      func(client) { containsText(client.name, filter.searchTerm) }
    ).map(
      func(client) : PublicClient {
        {
          name = client.name;
          status = client.status;
        };
      }
    ).sort(
      func(a, b) { Text.compare(a.name, b.name) }
    );
  };

  // Search for tasks - requires user authentication
  public query ({ caller }) func publicSearchTasks(filter : PublicSearchFilter) : async [PublicTask] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search tasks");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let allTasks = tasks.values().toArray();

    allTasks.filter(
      func(task) {
        let matchesSearch = containsText(task.title, filter.searchTerm) or containsText(task.clientName, filter.searchTerm);
        let hasAccess = isAdmin or task.assignedTo == caller or task.captains.any(func(captain) { captain == caller });
        matchesSearch and hasAccess;
      }
    ).map(
      func(task) : PublicTask {
        {
          title = task.title;
          taskType = task.taskType;
          status = task.status;
          clientName = task.clientName;
          assignedName = task.assignedName;
          dueDate = task.dueDate;
          completionDate = if (task.status == #completed) { task.completionDate } else { null };
          comment = task.comment;
          paymentStatus = task.paymentStatus;
          subType = task.subType;
          assignedDate = task.assignmentDate;
          taskSubType = task.taskType;
        };
      }
    ).sort(
      func(a, b) { Text.compare(a.title, b.title) }
    );
  };

  // Search for tasks by assignee name - requires user authentication
  public query ({ caller }) func publicSearchTasksByAssignee(filter : PublicSearchFilter) : async [PublicTaskByAssignee] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search tasks by assignee");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    tasks.values().toArray().filter(
      func(task) {
        let matchesSearch = containsText(task.assignedName, filter.searchTerm);
        let hasAccess = isAdmin or task.assignedTo == caller or task.captains.any(func(captain) { captain == caller });
        matchesSearch and hasAccess;
      }
    ).map(
      func(task) : PublicTaskByAssignee {
        {
          title = task.title;
          taskType = task.taskType;
          status = task.status;
          clientName = task.clientName;
          assignedName = task.assignedName;
          dueDate = task.dueDate;
          completionDate = if (task.status == #completed) { task.completionDate } else { null };
          comment = task.comment;
          paymentStatus = task.paymentStatus;
          taskSubType = task.taskType;
          assignedDate = task.assignmentDate;
          taskStatus = task.status;
        };
      }
    ).sort(
      func(a, b) { Text.compare(a.title, b.title) }
    );
  };

  //----------------------------------------
  // User Profile Management
  //----------------------------------------
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  //----------------------------------------
  // Authorization Helper for Tasks
  //----------------------------------------
  func canAccessTask(caller : Principal, task : Task) : Bool {
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let isAssignee = task.assignedTo == caller;
    let isCaptain = task.captains.any(func(captain) { captain == caller });
    isAdmin or isAssignee or isCaptain;
  };

  func canModifyTask(caller : Principal, task : Task) : Bool {
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let isAssignee = task.assignedTo == caller;
    isAdmin or isAssignee;
  };

  //----------------------------------------
  // To-Do Management (Persistent)
  //----------------------------------------
  func checkToDoAuthInternal(request : ToDoAuthRequest) : Bool {
    switch (toDoItems.get(request.todoId)) {
      case (?toDoItem) { Principal.equal(request.owner, toDoItem.owner) };
      case (null) { false };
    };
  };

  func checkToDoExistence(request : ToDoAuthRequest) : Bool {
    toDoItems.containsKey(request.todoId);
  };

  func isOwnedBy(request : ToDoAuthRequest) : Bool {
    checkToDoExistence(request) and checkToDoAuthInternal(request);
  };

  func checkToDoPermissions(owner : Principal, todoId : Nat32) {
    if (not (AccessControl.hasPermission(accessControlState, owner, #user))) {
      Runtime.trap("Unauthorized: Only users can modify to-dos");
    };

    let authReq = { owner; todoId };
    if (not checkToDoExistence(authReq)) {
      Runtime.trap("To-do item not found");
    };

    if (not isOwnedBy(authReq)) {
      Runtime.trap("Unauthorized: Only the owner can modify this to-do item");
    };
  };

  //----------------------------------------
  // To-Do CRUD Operations (Persistent)
  //----------------------------------------
  public shared ({ caller }) func addToDoItem(toDoItem : ToDoItemCreate) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add to-dos");
    };

    let newItem : ToDoItem = {
      id = nextToDoId;
      owner = caller;
      title = toDoItem.title;
      description = toDoItem.description;
      dueDate = toDoItem.dueDate;
      completed = false;
      createdAt = Time.now();
      modifiedAt = Time.now();
    };
    toDoItems.add(nextToDoId, newItem);
    nextToDoId += 1;
  };

  public query ({ caller }) func getUserToDos(user : Principal) : async [ToDoItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their to-dos");
    };
    // Users can only view their own to-dos
    if (caller != user) {
      Runtime.trap("Unauthorized: Can only view your own to-do items");
    };
    toDoItems.values().toArray().filter(func(item) { Principal.equal(item.owner, user) }).sort();
  };

  public shared ({ caller }) func updateToDoItem(request : ToDoAuthRequest, updatedToDoItem : ToDoItemUpdate) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update to-dos");
    };

    checkToDoPermissions(caller, request.todoId);

    switch (toDoItems.get(request.todoId)) {
      case (?existingItem) {
        toDoItems.add(
          request.todoId,
          {
            existingItem with
            title = updatedToDoItem.title;
            description = updatedToDoItem.description;
            dueDate = updatedToDoItem.dueDate;
            completed = updatedToDoItem.completed;
            modifiedAt = Time.now();
          },
        );
      };
      case (null) { Runtime.trap("To-do item not found") };
    };
  };

  public shared ({ caller }) func deleteToDoItem(request : ToDoAuthRequest) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete to-dos");
    };

    checkToDoPermissions(caller, request.todoId);
    toDoItems.remove(request.todoId);
  };

  func incrementToDoId() : Nat32 {
    let id = nextToDoId;
    nextToDoId += 1;
    id;
  };

  //----------------------------------------
  // To-Do Filter Operations
  //----------------------------------------
  public query ({ caller }) func filterToDosByUser(user : Principal, filterType : ToDoFilterType) : async [ToDoItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can filter to-dos");
    };

    // Users can only filter their own to-dos
    if (caller != user) {
      Runtime.trap("Unauthorized: Can only filter your own to-do items");
    };

    let userToDos = toDoItems.values().toArray().filter(func(item) { Principal.equal(item.owner, user) }).sort();

    switch (filterType) {
      case (#all) { userToDos };
      case (#today) {
        let todayDayNumber = Time.now() / 86400_000_000;
        userToDos.filter(
          func(todo) {
            switch (todo.dueDate) {
              case (?dueDate) {
                let dueDayNumber = dueDate / 86400_000_000;
                dueDayNumber == todayDayNumber;
              };
              case (null) { false };
            };
          }
        );
      };
    };
  };

  // Export function for to-do items - users can only export their own
  public query ({ caller }) func getToDosForExport() : async [ToDoItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can export to-dos");
    };

    // Users can only export their own to-dos
    toDoItems.values().toArray().filter(func(item) { Principal.equal(item.owner, caller) }).sort();
  };

  //----------------------------------------
  // End Refactored To-Do List Management
  //----------------------------------------

  //----------------------------------------
  // Client Management
  //----------------------------------------
  public shared ({ caller }) func addClients(newClients : [Client]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add clients");
    };

    for (c in newClients.values()) {
      let newClient : Client = {
        id = nextClientId;
        name = c.name;
        contactInfo = c.contactInfo;
        status = c.status;
        gstin = c.gstin;
        pan = c.pan;
        taskCategory = c.taskCategory;
        subCategory = c.subCategory;
        recurring = c.recurring;
      };
      clients.add(nextClientId, newClient);
      nextClientId += 1;
    };
  };

  public query ({ caller }) func getClients() : async [Client] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access client data");
    };

    clients.values().toArray().sort();
  };

  public shared ({ caller }) func updateClient(clientId : Nat32, updatedClient : Client) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update clients");
    };

    switch (clients.get(clientId)) {
      case (null) { Runtime.trap("Client not found") };
      case (?_) {
        let newClient : Client = {
          updatedClient with id = clientId;
        };
        clients.add(clientId, newClient);
      };
    };
  };

  public shared ({ caller }) func deleteClient(clientId : Nat32) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete clients");
    };

    clients.remove(clientId);
  };

  //----------------------------------------
  // Task Management
  //----------------------------------------
  public shared ({ caller }) func createTask(newTask : Task) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create tasks");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    // Only admins can set bill, advanceReceived, outstandingAmount, and payment status during creation
    if (not isAdmin) {
      if (newTask.bill != null) {
        Runtime.trap("Unauthorized: Only admins can set bill amounts");
      };

      if (newTask.advanceReceived != null) {
        Runtime.trap("Unauthorized: Only admins can set advance received");
      };

      if (newTask.outstandingAmount != null) {
        Runtime.trap("Unauthorized: Only admins can set outstanding amount");
      };

      if (newTask.paymentStatus != #pending) {
        Runtime.trap("Unauthorized: Only admins can set payment status");
      };

      // Non-admins can only create tasks assigned to themselves
      if (newTask.assignedTo != caller) {
        Runtime.trap("Unauthorized: Only admins can assign tasks to others");
      };

      // Non-admins cannot create completed tasks
      if (newTask.status == #completed) {
        Runtime.trap("Unauthorized: Only admins can create tasks with completed status");
      };

      // Non-admins cannot set captains
      if (newTask.captains.size() > 0) {
        Runtime.trap("Unauthorized: Only admins can assign captains");
      };
    };

    let finalAssignmentDate = switch (newTask.manualAssignmentDate, isAdmin) {
      case (?manualDate, true) { ?manualDate };
      case (?_, false) { Runtime.trap("Unauthorized: Only admins can set manual assignment dates") };
      case (null, _) { ?Time.now() };
    };

    let finalCompletionDate = if (newTask.status == #completed) {
      ?Time.now();
    } else {
      null;
    };

    let calculatedOutstandingAmount = switch (newTask.bill, newTask.advanceReceived) {
      case (?billText, ?advance) {
        switch (billText.toNat()) {
          case (?billAmount) {
            let advanceNat = advance;
            if (billAmount > advanceNat) {
              ?Nat.sub(billAmount, advanceNat);
            } else {
              ?0;
            };
          };
          case (null) { null };
        };
      };
      case (_, _) { null };
    };

    let newTaskWithStatus : Task = {
      newTask with
      id = nextTaskId;
      createdAt = Time.now();
      assignmentDate = finalAssignmentDate;
      completionDate = finalCompletionDate;
      outstandingAmount = calculatedOutstandingAmount;
    };

    tasks.add(nextTaskId, newTaskWithStatus);
    nextTaskId += 1;
  };

  public query ({ caller }) func getTasks() : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let allTasks = tasks.values().toArray();

    if (isAdmin) {
      allTasks.sort();
    } else {
      let userTasks = allTasks.filter(func(task) { canAccessTask(caller, task) });
      userTasks.sort();
    };
  };

  public shared ({ caller }) func updateTask(taskId : Nat32, updatedTask : Task) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update tasks");
    };

    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?existingTask) {
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);

        // Check if user can modify this task
        if (not canModifyTask(caller, existingTask)) {
          Runtime.trap("Unauthorized: Only the assigned user or admin can update this task");
        };

        if (not isAdmin) {
          if (updatedTask.bill != existingTask.bill) {
            Runtime.trap("Unauthorized: Only admins can modify bill amounts");
          };
          if (updatedTask.advanceReceived != existingTask.advanceReceived) {
            Runtime.trap("Unauthorized: Only admins can modify advance received");
          };
          if (updatedTask.outstandingAmount != existingTask.outstandingAmount) {
            Runtime.trap("Unauthorized: Only admins can modify outstanding amount");
          };
          if (updatedTask.paymentStatus != existingTask.paymentStatus) {
            Runtime.trap("Unauthorized: Only admins can modify payment status");
          };
          if (updatedTask.assignedTo != existingTask.assignedTo) {
            Runtime.trap("Unauthorized: Only admins can reassign tasks");
          };
          if (updatedTask.manualAssignmentDate != existingTask.manualAssignmentDate) {
            Runtime.trap("Unauthorized: Only admins can modify manual assignment dates");
          };
          if (updatedTask.completionDate != existingTask.completionDate) {
            Runtime.trap("Unauthorized: Only admins can manually modify completion dates");
          };
          // Non-admins cannot modify captains
          if (updatedTask.captains != existingTask.captains) {
            Runtime.trap("Unauthorized: Only admins can modify captains");
          };
        };

        let finalAssignmentDate = switch (updatedTask.manualAssignmentDate) {
          case (?manualDate) {
            ?manualDate;
          };
          case (null) {
            existingTask.assignmentDate;
          };
        };

        let finalCompletionDate = if (
          existingTask.status != #completed and updatedTask.status == #completed
        ) {
          switch (existingTask.completionDate) {
            case (null) { ?Time.now() };
            case (?existing) { ?existing };
          };
        } else if (
          existingTask.status == #completed and updatedTask.status != #completed
        ) {
          if (isAdmin and updatedTask.completionDate == null) {
            null;
          } else {
            existingTask.completionDate;
          };
        } else {
          existingTask.completionDate;
        };

        let calculatedOutstandingAmount = switch (updatedTask.bill, updatedTask.advanceReceived) {
          case (?billText, ?advance) {
            switch (billText.toNat()) {
              case (?billAmount) {
                let advanceNat = advance;
                if (billAmount > advanceNat) {
                  ?Nat.sub(billAmount, advanceNat);
                } else {
                  ?0;
                };
              };
              case (null) { null };
            };
          };
          case (_, _) { null };
        };

        let task : Task = {
          updatedTask with
          id = taskId;
          assignmentDate = finalAssignmentDate;
          completionDate = finalCompletionDate;
          outstandingAmount = calculatedOutstandingAmount;
        };

        tasks.add(taskId, task);
      };
    };
  };

  public shared ({ caller }) func deleteTask(taskId : Nat32) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete tasks");
    };

    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?existingTask) {
        if (not canModifyTask(caller, existingTask)) {
          Runtime.trap("Unauthorized: Only the assigned user or admin can delete this task");
        };
        tasks.remove(taskId);
      };
    };
  };

  //----------------------------------------
  // Task Assignment
  //----------------------------------------
  public shared ({ caller }) func assignTask(taskId : Nat32, assignedTo : Principal, assignedName : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can assign tasks");
    };

    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        let finalAssignmentDate = switch (task.manualAssignmentDate) {
          case (?manualDate) { ?manualDate };
          case (null) { ?Time.now() };
        };

        let updatedTask : Task = {
          task with assignedTo;
          assignedName;
          assignmentDate = finalAssignmentDate;
        };
        tasks.add(taskId, updatedTask);
      };
    };
  };

  //----------------------------------------
  // Task Captain Management
  //----------------------------------------
  public shared ({ caller }) func updateTaskCaptains(taskId : Nat32, captains : [Principal]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update task captains");
    };

    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        let updatedTask : Task = {
          task with captains;
        };
        tasks.add(taskId, updatedTask);
      };
    };
  };

  //----------------------------------------
  // Task Status Update
  //----------------------------------------
  public shared ({ caller }) func updateTaskStatus(taskId : Nat32, status : TaskStatus.Type) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update task status");
    };

    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (not canModifyTask(caller, task)) {
          Runtime.trap("Unauthorized: Only the assigned user or admin can update status");
        };

        let completionDate = if (
          task.status != #completed and status == #completed
        ) {
          switch (task.completionDate) {
            case (null) { ?Time.now() };
            case (?existing) { ?existing };
          };
        } else {
          task.completionDate;
        };

        let updatedTask : Task = {
          task with status;
          completionDate;
        };

        tasks.add(taskId, updatedTask);
      };
    };
  };

  //----------------------------------------
  // Task Comment Management
  //----------------------------------------
  public shared ({ caller }) func updateTaskComment(taskId : Nat32, comment : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update task comments");
    };

    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (not canModifyTask(caller, task)) {
          Runtime.trap("Unauthorized: Only the assigned user or admin can update comments");
        };
        let updatedTask : Task = { task with comment };
        tasks.add(taskId, updatedTask);
      };
    };
  };

  //----------------------------------------
  // Bill and Payment Management
  //----------------------------------------
  public shared ({ caller }) func updateTaskBill(taskId : Nat32, bill : ?Text, advanceReceived : ?Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update bills and payment details");
    };

    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        let updatedTask : Task = {
          task with bill;
          advanceReceived;
          outstandingAmount = calculateOutstandingAmount(bill, advanceReceived);
        };
        tasks.add(taskId, updatedTask);
      };
    };
  };

  public shared ({ caller }) func updatePaymentStatus(taskId : Nat32, paymentStatus : PaymentStatus.Type, advanceReceived : ?Nat, bill : ?Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update payment status");
    };

    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        let updatedTask : Task = {
          task with paymentStatus;
          advanceReceived;
          bill;
          outstandingAmount = calculateOutstandingAmount(bill, advanceReceived);
        };
        tasks.add(taskId, updatedTask);
      };
    };
  };

  //----------------------------------------
  // Payment Helper
  //----------------------------------------
  func calculateOutstandingAmount(bill : ?Text, advanceReceived : ?Nat) : ?Nat {
    switch (bill, advanceReceived) {
      case (?billText, ?advance) {
        switch (billText.toNat()) {
          case (?billAmount) {
            let advanceNat = advance;
            if (billAmount > advanceNat) {
              ?Nat.sub(billAmount, advanceNat);
            } else {
              ?0;
            };
          };
          case (null) { null };
        };
      };
      case (_, _) { null };
    };
  };

  //----------------------------------------
  // Task Retrieval and Filtering (Client Name References)
  //----------------------------------------
  public query ({ caller }) func searchClients(searchTerm : Text) : async [Client] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search for clients");
    };

    let filteredClients = clients.values().toArray().filter(
      func(client) {
        client.name.contains(#text searchTerm) or client.contactInfo.contains(#text searchTerm)
      }
    );
    filteredClients.sort();
  };

  public query ({ caller }) func getTasksByStatus(status : TaskStatus.Type) : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let allTasks = tasks.values().toArray();

    let filteredTasks = allTasks.filter(
      func(task) {
        task.status == status and (isAdmin or canAccessTask(caller, task))
      }
    );
    filteredTasks.sort();
  };

  public query ({ caller }) func getTasksByType(taskType : TaskType.Type) : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let allTasks = tasks.values().toArray();

    let filteredTasks = allTasks.filter(
      func(task) {
        task.taskType == taskType and (isAdmin or canAccessTask(caller, task))
      }
    );
    filteredTasks.sort();
  };

  //----------------------------------------
  // Team Management
  //----------------------------------------
  public shared ({ caller }) func createTeamMember(name : Text, principal : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create team members");
    };
    let member : TeamMember = {
      name;
      principal;
    };
    teamMembers.add(principal, member);
  };

  public query ({ caller }) func getAllTeamMembers() : async [TeamMember] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view team members");
    };
    teamMembers.values().toArray().sort();
  };

  //----------------------------------------
  // Bulk Assignee Import
  //----------------------------------------
  public shared ({ caller }) func bulkImportTeamMembers(teamMembersToImport : [TeamMemberData]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform bulk import");
    };

    if (teamMembersToImport.size() > 20) {
      Runtime.trap("Cannot import more than 20 team members at once");
    };

    for (teamMember in teamMembersToImport.values()) {
      teamMembers.add(teamMember.principal, {
        principal = teamMember.principal;
        name = teamMember.name;
      });
    };
  };

  //----------------------------------------
  // Bulk Imports for Clients and Tasks (with Client Name References)
  //----------------------------------------
  public shared ({ caller }) func bulkImportClients(clientsToImport : [Client]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform bulk import");
    };

    for (client in clientsToImport.values()) {
      let newClient : Client = {
        id = nextClientId;
        name = client.name;
        contactInfo = client.contactInfo;
        status = client.status;
        gstin = client.gstin;
        pan = client.pan;
        taskCategory = client.taskCategory;
        subCategory = client.subCategory;
        recurring = client.recurring;
      };
      clients.add(nextClientId, newClient);
      nextClientId += 1;
    };
  };

  public shared ({ caller }) func bulkImportTasks(tasksToImport : [Task]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform bulk import");
    };

    for (task in tasksToImport.values()) {
      let finalAssignmentDate = switch (task.manualAssignmentDate) {
        case (?manualDate) { ?manualDate };
        case (null) { ?Time.now() };
      };

      let finalCompletionDate = if (task.status == #completed) {
        ?Time.now();
      } else {
        null;
      };

      let calculatedOutstandingAmount = calculateOutstandingAmount(task.bill, task.advanceReceived);

      let taskData : Task = {
        task with
        id = nextTaskId;
        createdAt = Time.now();
        assignmentDate = finalAssignmentDate;
        completionDate = finalCompletionDate;
        outstandingAmount = calculatedOutstandingAmount;
      };
      tasks.add(nextTaskId, taskData);
      nextTaskId += 1;
    };
  };

  //----------------------------------------
  // Bulk Operations (with Client Name References)
  //----------------------------------------
  public shared ({ caller }) func updateClients(clientIds : [Nat32], updatedClients : [Client]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update clients");
    };

    if (clientIds.size() != updatedClients.size()) {
      Runtime.trap("Client IDs and updated clients array size mismatch");
    };

    clientIds.values().zip(updatedClients.values()).forEach(
      func((clientId, updatedClient)) {
        switch (clients.get(clientId)) {
          case (null) { Runtime.trap("Client with ID " # clientId.toText() # " not found") };
          case (?_) {
            let newClient : Client = { updatedClient with id = clientId };
            clients.add(clientId, newClient);
          };
        };
      }
    );
  };

  public shared ({ caller }) func deleteClients(clientIds : [Nat32]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete clients");
    };

    clientIds.forEach(
      func(clientId) {
        switch (clients.get(clientId)) {
          case (null) { Runtime.trap("Client with ID " # clientId.toText() # " not found") };
          case (?_) {
            clients.remove(clientId);
          };
        };
      }
    );
  };

  public shared ({ caller }) func updateTasks(taskIds : [Nat32], updatedTasks : [Task]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform bulk task updates");
    };

    if (taskIds.size() != updatedTasks.size()) {
      Runtime.trap("Task IDs and updated tasks array size mismatch");
    };

    taskIds.values().zip(updatedTasks.values()).forEach(
      func((taskId, updatedTask)) {
        switch (tasks.get(taskId)) {
          case (null) { Runtime.trap("Task with ID " # taskId.toText() # " not found") };
          case (?existingTask) {
            let finalAssignmentDate = switch (updatedTask.manualAssignmentDate) {
              case (?manualDate) { ?manualDate };
              case (null) { existingTask.assignmentDate };
            };

            let finalCompletionDate = if (
              existingTask.status != #completed and updatedTask.status == #completed
            ) {
              switch (existingTask.completionDate) {
                case (null) { ?Time.now() };
                case (?existing) { ?existing };
              };
            } else {
              existingTask.completionDate;
            };

            let calculatedOutstandingAmount = calculateOutstandingAmount(updatedTask.bill, updatedTask.advanceReceived);

            let newTask : Task = {
              updatedTask with
              id = taskId;
              assignmentDate = finalAssignmentDate;
              completionDate = finalCompletionDate;
              outstandingAmount = calculatedOutstandingAmount;
            };
            tasks.add(taskId, newTask);
          };
        };
      }
    );
  };

  public shared ({ caller }) func deleteTasks(taskIds : [Nat32]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform bulk task deletion");
    };

    taskIds.forEach(
      func(taskId) {
        switch (tasks.get(taskId)) {
          case (null) { Runtime.trap("Task with ID " # taskId.toText() # " not found") };
          case (?_) {
            tasks.remove(taskId);
          };
        };
      }
    );
  };

  //----------------------------------------
  // Task Filtering (with Search Term Support)
  //----------------------------------------
  func matchesTextFilter(filterValue : ?Text, taskValue : Text) : Bool {
    switch (filterValue) {
      case (null) { true };
      case (?value) { Text.equal(value, taskValue) };
    };
  };

  func matchesCommentFilter(filterValue : ?Text, taskComment : ?Text) : Bool {
    switch (filterValue, taskComment) {
      case (null, _) { true };
      case (?filter, null) { false };
      case (?filter, ?comment) {
        let filterLower = filter.toLower();
        let commentLower = comment.toLower();
        commentLower.contains(#text filterLower);
      };
    };
  };

  func matchesSearchTerm(task : Task, searchTerm : ?Text) : Bool {
    switch (searchTerm) {
      case (null) { true };
      case (?term) {
        let termLower = term.toLower();
        let clientName = task.clientName.toLower();
        let title = task.title.toLower();
        clientName.contains(#text termLower) or title.contains(#text termLower)
      };
    };
  };

  func taskMatchesFilter(task : Task, filter : TaskFilter) : Bool {
    switch (filter.taskType) {
      case (null) {};
      case (?taskType) {
        if (task.taskType != taskType) { return false };
      };
    };

    if (not matchesTextFilter(filter.assigneeName, task.assignedName)) {
      return false;
    };

    switch (filter.status) {
      case (null) {};
      case (?status) {
        if (task.status != status) { return false };
      };
    };

    switch (filter.paymentStatus) {
      case (null) {};
      case (?paymentStatus) {
        if (task.paymentStatus != paymentStatus) { return false };
      };
    };

    switch (filter.subType, task.subType) {
      case (null, _) {};
      case (?t, ?v) {
        if (not Text.equal(t, v)) { return false };
      };
      case (_, null) { return false };
    };

    if (not matchesCommentFilter(filter.comment, task.comment)) {
      return false;
    };

    if (not matchesSearchTerm(task, filter.searchTerm)) {
      return false;
    };

    true;
  };

  func filterTasksHelper(tasksValues : [Task], callback : (Task) -> Bool) : List.List<Task> {
    let result = List.empty<Task>();
    for (task in tasksValues.values()) {
      if (callback(task)) { result.add(task) };
    };
    result;
  };

  public query ({ caller }) func filterTasks(params : TaskFilter) : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    let taskValues = tasks.values().toArray();
    let filteredTasks = filterTasksHelper(
      taskValues,
      func(task) {
        if (not taskMatchesFilter(task, params)) {
          return false;
        };

        if (not isAdmin and not canAccessTask(caller, task)) {
          return false;
        };

        true;
      },
    );
    filteredTasks.toArray();
  };

  //----------------------------------------
  // Export to Excel
  //----------------------------------------
  public query ({ caller }) func getTasksForExport() : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can export tasks");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let allTasks = tasks.values().toArray();

    if (isAdmin) {
      allTasks.sort();
    } else {
      let userTasks = allTasks.filter(func(task) { canAccessTask(caller, task) });
      userTasks.sort();
    };
  };

  //----------------------------------------
  // Task Export with Selection Support
  //----------------------------------------
  type TaskId = Nat32;

  public query ({ caller }) func getSelectedTasksForExport(selectedTaskIds : [TaskId]) : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can export selected tasks");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let tasksArray = tasks.values().toArray();
    let selectedTasks = tasksArray.filter(
      func(task) {
        let isSelected = selectedTaskIds.any(
          func(taskId) { task.id == taskId }
        );
        if (isSelected) {
          if (isAdmin or canAccessTask(caller, task)) {
            return true;
          };
        };
        false;
      }
    );
    selectedTasks.sort();
  };

  public query ({ caller }) func getAllTasksForExport() : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can export all tasks");
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    if (isAdmin) {
      tasks.values().toArray().sort();
    } else {
      let userTasks = tasks.values().toArray().filter(func(task) { canAccessTask(caller, task) });
      userTasks.sort();
    };
  };

  //----------------------------------------
  // Task Sorting (Client Name)
  //----------------------------------------
  func compareClientNameAscending(a : Task, b : Task) : Order.Order {
    Text.compare(a.clientName, b.clientName);
  };

  func compareClientNameDescending(a : Task, b : Task) : Order.Order {
    switch (Text.compare(a.clientName, b.clientName)) {
      case (#less) { #greater };
      case (#greater) { #less };
      case (#equal) { #equal };
    };
  };

  public query ({ caller }) func filterAndSortByClientName(filter : TaskFilter, ascending : Bool) : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    let taskArray = tasks.values().toArray();
    let filteredTasks = taskArray.filter(
      func(task) {
        if (not taskMatchesFilter(task, filter)) {
          return false;
        };

        if (not isAdmin and not canAccessTask(caller, task)) {
          return false;
        };
        true;
      }
    );

    if (filteredTasks.size() <= 1) { return filteredTasks };

    filteredTasks.sort(
      if (ascending) { compareClientNameAscending } else { compareClientNameDescending }
    );
  };

  //----------------------------------------
  // Revenue Cards Calculation
  //----------------------------------------
  public query ({ caller }) func getRevenueCardsData() : async RevenueResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access revenue data");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let tasksArray = tasks.values().toArray();

    let visibleTasks = if (isAdmin) {
      tasksArray;
    } else {
      tasksArray.filter(func(task) { canAccessTask(caller, task) });
    };

    var totalRevenue = 0;
    var totalCollected = 0;
    var totalOutstanding = 0;

    for (task in visibleTasks.values()) {
      switch (task.bill) {
        case (?amountText) {
          switch (amountText.toNat()) {
            case (?amount) { totalRevenue += amount };
            case (null) {};
          };
        };
        case (null) {};
      };

      switch (task.advanceReceived) {
        case (?amount) { totalCollected += amount };
        case (null) {};
      };

      switch (task.outstandingAmount) {
        case (?amount) {
          if (task.paymentStatus == #pending or amount > 0) {
            totalOutstanding += amount;
          };
        };
        case (null) {};
      };
    };

    {
      totalRevenue;
      totalCollected;
      totalOutstanding;
    };
  };

  //----------------------------------------
  // Revenue Modal Response
  //----------------------------------------
  public query ({ caller }) func getRevenueModalData(cardType : RevenueCardType) : async RevenueModalResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access detailed revenue data");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let tasksArray = tasks.values().toArray();

    let visibleTasks = if (isAdmin) {
      tasksArray;
    } else {
      tasksArray.filter(func(task) { canAccessTask(caller, task) });
    };

    let itemsList = List.empty<RevenueTaskDetails>();

    switch (cardType) {
      case (#totalRevenue) {
        var totalAmount = 0;

        for (task in visibleTasks.values()) {
          switch (task.bill) {
            case (?amountText) {
              switch (amountText.toNat()) {
                case (?amount) { totalAmount += amount };
                case (null) {};
              };
              itemsList.add({
                taskName = task.title;
                clientName = task.clientName;
                bill = task.bill;
                advanceReceived = task.advanceReceived;
                outstandingAmount = task.outstandingAmount;
                paymentStatus = task.paymentStatus;
              });
            };
            case (null) {};
          };
        };

        {
          totalAmount;
          items = itemsList.toArray();
        };
      };
      case (#totalCollected) {
        var totalAmount = 0;

        for (task in visibleTasks.values()) {
          if (task.paymentStatus == #paid) {
            switch (task.advanceReceived) {
              case (?amount) { totalAmount += amount };
              case (null) {};
            };

            itemsList.add({
              taskName = task.title;
              clientName = task.clientName;
              bill = task.bill;
              advanceReceived = task.advanceReceived;
              outstandingAmount = task.outstandingAmount;
              paymentStatus = task.paymentStatus;
            });
          };
        };

        {
          totalAmount;
          items = itemsList.toArray();
        };
      };
      case (#totalOutstanding) {
        var totalAmount = 0;

        for (task in visibleTasks.values()) {
          if (task.paymentStatus == #pending or isMaybePositive(task.outstandingAmount)) {
            switch (task.outstandingAmount) {
              case (?amount) {
                if (task.paymentStatus == #pending or amount > 0) {
                  totalAmount += amount;
                };
              };
              case (null) {};
            };

            itemsList.add({
              taskName = task.title;
              clientName = task.clientName;
              bill = task.bill;
              advanceReceived = task.advanceReceived;
              outstandingAmount = task.outstandingAmount;
              paymentStatus = task.paymentStatus;
            });
          };
        };

        {
          totalAmount;
          items = itemsList.toArray();
        };
      };
    };
  };

  //----------------------------------------
  // Due Date Cards and Modal Functionality (Updated)
  //----------------------------------------
  func doesDueDateMatchDayType(dueDate : Time.Time, dayType : DueDateDayType) : Bool {
    let dayNumber = dueDateToDayNumber(dueDate);

    switch (dayType) {
      case (#anyDate) { true };
      case (#dueToday) {
        let todayDayNumber = dueDateToDayNumber(Time.now());
        dayNumber == todayDayNumber;
      };
      case (#dueTomorrow) {
        let todayDayNumber = dueDateToDayNumber(Time.now());
        let tomorrowDayNumber = todayDayNumber + 1;
        dayNumber == tomorrowDayNumber;
      };
      case (#customDate(customDayNumber)) {
        let taskDayNumber = dueDateToDayNumber(dueDate);
        let targetDayNumber = dueDateToDayNumber(customDayNumber);
        taskDayNumber == targetDayNumber;
      };
    };
  };

  public query ({ caller }) func getDueDateCardCounts() : async DueDateCountResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access due date data");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let tasksArray = tasks.values().toArray();

    let visibleTasks = if (isAdmin) {
      tasksArray;
    } else {
      tasksArray.filter(func(task) { canAccessTask(caller, task) });
    };

    var dueTodayCount = 0;
    var dueTomorrowCount = 0;
    var anyDateCount = 0;

    for (task in visibleTasks.values()) {
      switch (task.dueDate) {
        case (?dueDate) {
          anyDateCount += 1;
          let taskDayNumber = dueDateToDayNumber(dueDate);
          let todayDayNumber = dueDateToDayNumber(Time.now());
          let tomorrowDayNumber = todayDayNumber + 1;
          if (taskDayNumber == todayDayNumber) { dueTodayCount += 1 };
          if (taskDayNumber == tomorrowDayNumber) { dueTomorrowCount += 1 };
        };
        case (null) {};
      };
    };
    {
      dueTodayCount;
      dueTomorrowCount;
      anyDateCount;
      customDateCount = 0 : Nat;
    };
  };

  public query ({ caller }) func getDueDateModalData(dayType : ?DueDateDayType, customDate : ?Time.Time) : async ?DueDateModalResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access detailed due date data");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    let tasksArray = tasks.values().toArray();
    let visibleTasks = if (isAdmin) {
      tasksArray;
    } else {
      tasksArray.filter(func(task) { canAccessTask(caller, task) });
    };

    let dayTypeFallback = switch (dayType) {
      case (null) { #dueToday };
      case (?dt) { dt };
    };

    let itemsList = List.empty<DueDateTaskDetails>();
    var filteredTaskCount = 0;
    let todayDayNumber = dueDateToDayNumber(Time.now());

    for (task in visibleTasks.values()) {
      switch (task.dueDate) {
        case (?dueDate) {
          if (doesDueDateMatchDayType(dueDate, dayTypeFallback)) {
            filteredTaskCount += 1;
            itemsList.add({
              clientName = task.clientName;
              taskTitle = task.title;
              assignee = task.assignedName;
              status = task.status;
              paymentStatus = task.paymentStatus;
              dueDate = task.dueDate;
              comments = task.comment;
            });
          };
        };
        case (null) {};
      };
    };

    if (filteredTaskCount == 0) { return null };

    ?{
      taskCount = filteredTaskCount;
      items = itemsList.toArray();
    };
  };

  //----------------------------------------
  // Helper Functions
  //----------------------------------------
  func isMaybePositive(maybeNumber : ?Nat) : Bool {
    switch (maybeNumber) {
      case (?number) { number > 0 };
      case (null) { false };
    };
  };

  func dueDateToDayNumber(dueDate : Time.Time) : Int {
    let dayMicros : Int = 86400_000_000;
    dueDate / dayMicros;
  };

  //----------------------------------------
  // Date-Based Task Search (Dual Matching)
  //----------------------------------------
  public query ({ caller }) func searchTasksByDate(date : Time.Time) : async DateSearchResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search tasks by date");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let tasksArray = tasks.values().toArray();

    let filteredTasks = tasksArray.filter(
      func(task) {
        let dateMatches = func(taskDate : ?Time.Time) : Bool {
          switch (taskDate) {
            case (?dateVal) {
              let taskDay = normalizeDateToLocalDay(dateVal);
              let searchDay = normalizeDateToLocalDay(date);
              taskDay == searchDay;
            };
            case (null) { false };
          };
        };
        let dueDateMatches = dateMatches(task.dueDate);
        let completionDateMatches = dateMatches(task.completionDate);
        (isAdmin or canAccessTask(caller, task)) and (dueDateMatches or completionDateMatches);
      }
    );

    {
      date;
      tasks = filteredTasks;
    };
  };

  //----------------------------------------
  // Date Filtering Helper
  //----------------------------------------
  public query ({ caller }) func filterTasksByDate(targetDate : Time.Time, _includeDueDate : Bool, _includeCompletionDate : Bool) : async DateSearchResult {
    // The parameters includeDueDate and includeCompletionDate are accepted
    // but not used. Could be re-added for future feature updates.

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search tasks by date");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    let filteredTasks = tasks.values().toArray().filter(
      func(task) {
        let matchesDate = func(dateOption : ?Time.Time) : Bool {
          switch (dateOption) {
            case (null) { false };
            case (?date) { areDatesSameDay(date, targetDate) };
          };
        };

        if (not isAdmin and not canAccessTask(caller, task)) {
          return false;
        };

        matchesDate(task.dueDate) or matchesDate(task.completionDate);
      }
    );

    { date = targetDate; tasks = filteredTasks };
  };

  func normalizeDateToLocalDay(date : Time.Time) : Int {
    let dayMicros : Int = 86400_000_000;
    date / dayMicros;
  };

  func areDatesSameDay(date1 : Time.Time, date2 : Time.Time) : Bool {
    normalizeDateToLocalDay(date1) == normalizeDateToLocalDay(date2);
  };

  //----------------------------------------
  // Dashboard Task List Sorting
  //----------------------------------------
  func compareDueDate(a : Task, b : Task) : Order.Order {
    switch (a.dueDate, b.dueDate) {
      case (null, null) { #equal };
      case (null, ?_) { #greater };
      case (?_, null) { #less };
      case (?aDate, ?bDate) {
        if (aDate > bDate) { #greater } else {
          if (aDate < bDate) { #less } else {
            #equal;
          };
        };
      };
    };
  };

  func compareCompletionDate(a : Task, b : Task) : Order.Order {
    switch (a.completionDate, b.completionDate) {
      case (null, null) { #equal };
      case (null, ?_) { #greater };
      case (?_, null) { #less };
      case (?aDate, ?bDate) {
        if (aDate > bDate) { #greater } else {
          if (aDate < bDate) { #less } else {
            #equal;
          };
        };
      };
    };
  };

  public query ({ caller }) func getDashboardTasks(request : DashboardTasksRequest) : async DashboardTasksResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access dashboard tasks");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let tasksArray = tasks.values().toArray();

    let visibleTasks = if (isAdmin) {
      tasksArray;
    } else {
      tasksArray.filter(func(task) { canAccessTask(caller, task) });
    };

    let sortedByDueDate = visibleTasks.sort(
      func(a, b) {
        let result = compareDueDate(a, b);
        if (request.dueDateSortDirection == #desc) {
          switch (result) {
            case (#less) { #greater };
            case (#greater) { #less };
            case (#equal) { #equal };
          };
        } else {
          result;
        };
      }
    );

    let sortedByCompletionDate = visibleTasks.sort(
      func(a, b) {
        let result = compareCompletionDate(a, b);
        if (request.completionDateSortDirection == #desc) {
          switch (result) {
            case (#less) { #greater };
            case (#greater) { #less };
            case (#equal) { #equal };
          };
        } else {
          result;
        };
      }
    );

    {
      dueDateSorted = sortedByDueDate;
      completionDateSorted = sortedByCompletionDate;
    };
  };
};
