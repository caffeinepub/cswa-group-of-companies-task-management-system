import type { Client, TeamMember, Task, ToDoItem, PublicTask, PublicTaskByAssignee } from '../backend';
import { Type, Type__2, Type__3 } from '../backend';

// Simple CSV parser for Excel files (Excel can open CSV files)
export function parseExcelFile(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/);
        const rows: string[][] = [];
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          // Simple CSV parsing (handles basic cases)
          const cells: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              cells.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          cells.push(current.trim());
          rows.push(cells);
        }
        
        resolve(rows);
      } catch (err) {
        reject(new Error('Failed to parse file: ' + (err as Error).message));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function downloadClientTemplate() {
  const headers = ['Name of Client', 'GSTIN', 'PAN', 'Task Category', 'Sub Category', 'Recurring of Task'];
  const sampleData = [
    ['ABC Enterprises Ltd', '27AABCU9603R1ZM', 'AABCU9603R', 'GST', 'GST Return Filing', 'Monthly'],
    ['XYZ Consultants Pvt Ltd', '29AACFX1234A1Z5', 'AACFX1234A', 'Audit', 'Internal Audit', 'Yearly'],
    ['Tech Solutions Inc', '', 'AADCT5678B', 'IT Notice', 'Assessment Notice', 'Quarterly'],
    ['Global Trading Co', '19AABCG9876C1ZX', '', 'TDS', 'TDS Return Filing', 'Quarterly'],
    ['Finance Corp', '', 'AABCF1234D', 'Accounts', 'Bookkeeping', 'Monthly'],
    ['Legal Services Ltd', '', 'AABCL5678E', 'Form Filing', 'Annual Returns', 'Yearly'],
    ['Consulting Group', '', 'AABCC9012F', 'CA Certificate', 'Certification', ''],
    ['Trading Co', '', 'AABCT3456G', 'Others', 'Compliance Review', ''],
  ];

  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => row.map(cell => {
      // Escape cells that contain commas
      if (cell.includes(',')) {
        return `"${cell}"`;
      }
      return cell;
    }).join(','))
  ].join('\n');

  // Add reference information
  const referenceInfo = `

# Reference Information:
# - Name of Client: Required field
# - GSTIN: Optional, 15-character alphanumeric code
# - PAN: Optional, 10-character alphanumeric code
# - Task Category: Optional (GST, Audit, IT Notice, TDS, Accounts, Form Filing, CA Certificate, Others)
# - Sub Category: Optional, any text
# - Recurring of Task: Optional (Monthly, Quarterly, Yearly)
`;

  downloadCSV(csvContent + referenceInfo, 'client_import_template.csv');
}

export function downloadTaskTemplate(clients: Client[], teamMembers: TeamMember[]) {
  const headers = ['Client Name', 'Title', 'Task Type', 'Sub Type', 'Status', 'Comment', 'Assigned Name', 'Due Date', 'Assignment Date', 'Bill', 'Advance Received', 'Payment Status'];
  
  // Create sample data with actual client names and team member names
  const sampleData: string[][] = [];
  
  if (clients.length > 0 && teamMembers.length > 0) {
    const sampleClient = clients[0];
    const sampleMember = teamMembers[0];
    
    sampleData.push([
      sampleClient.name,
      'GST Filing for Q1',
      'GST',
      'GST Return Filing',
      'Pending',
      'Initial review completed',
      sampleMember.name,
      '2026-03-31',
      '2026-01-15',
      '50000',
      '25000',
      'Pending',
    ]);
    
    if (clients.length > 1) {
      sampleData.push([
        clients[1].name,
        'Annual Audit Review',
        'Audit',
        'Internal Audit',
        'In Progress',
        'Awaiting final documents',
        sampleMember.name,
        '2026-04-15',
        '2026-02-01',
        '100000',
        '100000',
        'Paid',
      ]);
      
      sampleData.push([
        sampleClient.name,
        'TDS Return Filing',
        'TDS',
        'Quarterly TDS',
        'Pending',
        'Follow up required',
        sampleMember.name,
        '2026-02-28',
        '2026-01-10',
        '25000',
        '10000',
        'Overdue',
      ]);
    }
  } else {
    // Fallback sample data
    sampleData.push([
      'ABC Enterprises Ltd',
      'GST Filing for Q1',
      'GST',
      'GST Return Filing',
      'Pending',
      'Initial review completed',
      'John Doe',
      '2026-03-31',
      '2026-01-15',
      '50000',
      '25000',
      'Pending',
    ]);
    sampleData.push([
      'XYZ Consultants Pvt Ltd',
      'Annual Audit Review',
      'Audit',
      'Internal Audit',
      'In Progress',
      'Awaiting final documents',
      'Jane Smith',
      '2026-04-15',
      '2026-02-01',
      '100000',
      '100000',
      'Paid',
    ]);
  }

  let csvContent = headers.join(',') + '\n';
  csvContent += sampleData.map(row => row.map(cell => {
    // Escape cells that contain commas
    if (cell.includes(',')) {
      return `"${cell}"`;
    }
    return cell;
  }).join(',')).join('\n');

  // Add reference data as comments
  if (clients.length > 0 || teamMembers.length > 0) {
    csvContent += '\n\n# Available Clients:\n';
    clients.forEach(client => {
      csvContent += `# ${client.name}\n`;
    });
    
    csvContent += '\n# Available Team Members:\n';
    teamMembers.forEach(member => {
      csvContent += `# ${member.name} (Principal: ${member.principal.toString()})\n`;
    });
  }

  csvContent += '\n# Task Types: GST, Audit, IT Notice, TDS, Accounts, Form Filing, CA Certificate, Other\n';
  csvContent += '# Status: Pending, In Progress, Completed, Docs Pending, Hold\n';
  csvContent += '# Payment Status: Pending, Paid, Overdue\n';
  csvContent += '# Due Date: Format YYYY-MM-DD (e.g., 2026-03-31)\n';
  csvContent += '# Assignment Date: Format YYYY-MM-DD (e.g., 2026-01-15) - optional manual assignment date\n';
  csvContent += '# Bill: Numeric amount (e.g., 50000)\n';
  csvContent += '# Advance Received: Numeric amount (e.g., 25000)\n';
  csvContent += '# Note: Outstanding balance is calculated automatically (Bill - Advance Received)\n';

  downloadCSV(csvContent, 'task_import_template.csv');
}

export function downloadTeamMemberTemplate() {
  const headers = ['Name'];
  const sampleData = [
    ['John Doe'],
    ['Jane Smith'],
    ['Robert Johnson'],
    ['Emily Davis'],
    ['Michael Brown'],
  ];

  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => row.join(','))
  ].join('\n');

  // Add reference information
  const referenceInfo = `

# Reference Information:
# - Name: Required field - Team member's display name
# - Maximum 20 team members per upload
# - Principal IDs will be automatically generated by the system
# - Imported team members will appear in task assignment dropdowns
`;

  downloadCSV(csvContent + referenceInfo, 'team_member_import_template.csv');
}

// Helper function to convert enum values to readable text
function getTaskTypeLabel(taskType: Type__3): string {
  switch (taskType) {
    case Type__3.GST:
      return 'GST';
    case Type__3.Audit:
      return 'Audit';
    case Type__3.ITNotice:
      return 'IT Notice';
    case Type__3.TDS:
      return 'TDS';
    case Type__3.Accounts:
      return 'Accounts';
    case Type__3.FormFiling:
      return 'Form Filing';
    case Type__3.CACertificate:
      return 'CA Certificate';
    case Type__3.Other:
      return 'Other';
    default:
      return 'Unknown';
  }
}

function getTaskStatusLabel(status: Type__2): string {
  switch (status) {
    case Type__2.pending:
      return 'Pending';
    case Type__2.inProgress:
      return 'In Progress';
    case Type__2.completed:
      return 'Completed';
    case Type__2.docsPending:
      return 'Docs Pending';
    case Type__2.hold:
      return 'Hold';
    default:
      return 'Unknown';
  }
}

function getPaymentStatusLabel(paymentStatus: Type): string {
  switch (paymentStatus) {
    case Type.pending:
      return 'Pending';
    case Type.paid:
      return 'Paid';
    case Type.overdue:
      return 'Overdue';
    default:
      return 'Unknown';
  }
}

// Helper function to format dates consistently
function formatDateForExport(timestamp: bigint | undefined): string {
  if (!timestamp) return '';
  const date = new Date(Number(timestamp) / 1000000);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Export tasks to Excel (CSV format)
export function exportTasksToExcel(tasks: Task[]) {
  const headers = [
    'Client Name',
    'Task Name',
    'Task Category',
    'Sub Category',
    'Status',
    'Comment',
    'Assigned Name',
    'Due Date',
    'Assignment Date',
    'Completion Date',
    'Bill',
    'Advance Received',
    'Outstanding Amount',
    'Payment Status',
    'Created Date',
  ];

  const rows = tasks.map(task => {
    // Format the created date
    const createdDate = new Date(Number(task.createdAt) / 1000000);
    const formattedCreatedDate = createdDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // Format the due date
    let formattedDueDate = '';
    if (task.dueDate) {
      const dueDate = new Date(Number(task.dueDate) / 1000000);
      formattedDueDate = dueDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }

    // Format the assignment date - prioritize manualAssignmentDate over assignmentDate
    let formattedAssignmentDate = '';
    const dateToUse = task.manualAssignmentDate || task.assignmentDate;
    if (dateToUse) {
      const assignmentDate = new Date(Number(dateToUse) / 1000000);
      formattedAssignmentDate = assignmentDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }

    // Format the completion date
    let formattedCompletionDate = '';
    if (task.completionDate) {
      const completionDate = new Date(Number(task.completionDate) / 1000000);
      formattedCompletionDate = completionDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }

    return [
      task.clientName,
      task.title,
      getTaskTypeLabel(task.taskType),
      task.subType || '',
      getTaskStatusLabel(task.status),
      task.comment || '',
      task.assignedName,
      formattedDueDate,
      formattedAssignmentDate,
      formattedCompletionDate,
      task.bill || '',
      task.advanceReceived ? task.advanceReceived.toString() : '',
      task.outstandingAmount ? task.outstandingAmount.toString() : '',
      getPaymentStatusLabel(task.paymentStatus),
      formattedCreatedDate,
    ];
  });

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape cells that contain commas or quotes
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
  ].join('\n');

  // Generate filename with current date
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const filename = `task_report_${dateStr}.csv`;

  downloadCSV(csvContent, filename);
}

// Export public search tasks to Excel (CSV format)
export function exportPublicSearchTasksToExcel(tasks: PublicTask[]) {
  const headers = [
    'Title',
    'Client Name',
    'Task Type',
    'Task Sub Type',
    'Assigned To',
    'Status',
    'Payment Status',
    'Assigned Date',
    'Due Date',
    'Completion Date',
    'Comment',
  ];

  const rows = tasks.map(task => [
    task.title,
    task.clientName,
    getTaskTypeLabel(task.taskType),
    getTaskTypeLabel(task.taskSubType),
    task.assignedName,
    getTaskStatusLabel(task.status),
    getPaymentStatusLabel(task.paymentStatus),
    formatDateForExport(task.assignedDate),
    formatDateForExport(task.dueDate),
    task.status === 'completed' ? formatDateForExport(task.completionDate) : '',
    task.comment || '',
  ]);

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape cells that contain commas or quotes
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
  ].join('\n');

  // Generate filename with current date
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const filename = `public_search_tasks_${dateStr}.csv`;

  downloadCSV(csvContent, filename);
}

// Export public search tasks by assignee to Excel (CSV format)
export function exportPublicSearchTasksByAssigneeToExcel(tasks: PublicTaskByAssignee[]) {
  const headers = [
    'Title',
    'Client Name',
    'Task Type',
    'Task Sub Type',
    'Task Status',
    'Payment Status',
    'Assigned Date',
    'Due Date',
    'Completion Date',
    'Comment',
  ];

  const rows = tasks.map(task => [
    task.title,
    task.clientName,
    getTaskTypeLabel(task.taskType),
    getTaskTypeLabel(task.taskSubType),
    getTaskStatusLabel(task.status),
    getPaymentStatusLabel(task.paymentStatus),
    formatDateForExport(task.assignedDate),
    formatDateForExport(task.dueDate),
    task.status === 'completed' ? formatDateForExport(task.completionDate) : '',
    task.comment || '',
  ]);

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape cells that contain commas or quotes
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
  ].join('\n');

  // Generate filename with current date
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const filename = `team_member_tasks_${dateStr}.csv`;

  downloadCSV(csvContent, filename);
}

// Export to-dos to Excel (CSV format)
export function exportToDosToExcel(todos: ToDoItem[]) {
  const headers = [
    'Title',
    'Description',
    'Due Date',
    'Completion Status',
    'Created Date',
    'Modified Date',
  ];

  const rows = todos.map(todo => {
    // Format the created date
    const createdDate = new Date(Number(todo.createdAt) / 1000000);
    const formattedCreatedDate = createdDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // Format the modified date
    const modifiedDate = new Date(Number(todo.modifiedAt) / 1000000);
    const formattedModifiedDate = modifiedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // Format the due date
    let formattedDueDate = '';
    if (todo.dueDate) {
      const dueDate = new Date(Number(todo.dueDate) / 1000000);
      formattedDueDate = dueDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }

    return [
      todo.title,
      todo.description || '',
      formattedDueDate,
      todo.completed ? 'Completed' : 'Pending',
      formattedCreatedDate,
      formattedModifiedDate,
    ];
  });

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape cells that contain commas or quotes
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
  ].join('\n');

  // Generate filename with current date
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const filename = `todo_list_${dateStr}.csv`;

  downloadCSV(csvContent, filename);
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
