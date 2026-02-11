import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useBulkImportTasks, useGetClients, useGetAllTeamMembers } from '../hooks/useQueries';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Download, Upload, Loader2 } from 'lucide-react';
import { Type, Type__1, Type__2, Type__3, type Task } from '../backend';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { downloadTaskTemplate, parseExcelFile } from '../lib/excelTemplates';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

interface BulkImportTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PreviewTask {
  clientName: string;
  title: string;
  taskType: string;
  subType: string;
  status: string;
  comment: string;
  assignedName: string;
  dueDate: string;
  assignmentDate: string;
  bill: string;
  advanceReceived: string;
  paymentStatus: string;
  error?: string;
}

export default function BulkImportTasksDialog({ open, onOpenChange }: BulkImportTasksDialogProps) {
  const [csvData, setCsvData] = useState('');
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState<PreviewTask[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const bulkImportTasks = useBulkImportTasks();
  const { data: clients = [] } = useGetClients();
  const { data: teamMembers = [] } = useGetAllTeamMembers();

  const validateTaskType = (type: string): Type__3 | null => {
    const normalized = type.toLowerCase().trim();
    if (normalized === 'gst') return Type__3.GST;
    if (normalized === 'audit') return Type__3.Audit;
    if (normalized === 'it notice' || normalized === 'itnotice') return Type__3.ITNotice;
    if (normalized === 'tds') return Type__3.TDS;
    if (normalized === 'accounts') return Type__3.Accounts;
    if (normalized === 'form filing' || normalized === 'formfiling') return Type__3.FormFiling;
    if (normalized === 'ca certificate' || normalized === 'cacertificate') return Type__3.CACertificate;
    if (normalized === 'other' || normalized === 'others') return Type__3.Other;
    return null;
  };

  const validateStatus = (status: string): Type__2 | null => {
    const normalized = status.toLowerCase().trim();
    if (normalized === 'pending') return Type__2.pending;
    if (normalized === 'in progress' || normalized === 'inprogress') return Type__2.inProgress;
    if (normalized === 'completed') return Type__2.completed;
    return null;
  };

  const validatePaymentStatus = (status: string): Type | null => {
    const normalized = status.toLowerCase().trim();
    if (normalized === 'pending') return Type.pending;
    if (normalized === 'paid') return Type.paid;
    if (normalized === 'overdue') return Type.overdue;
    return null;
  };

  const validateClientName = (clientName: string): boolean => {
    const trimmedName = clientName.trim();
    return clients.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase());
  };

  const findTeamMemberByName = (name: string): { principal: Principal; name: string } | null => {
    const trimmedName = name.trim();
    const member = teamMembers.find((m) => m.name.toLowerCase() === trimmedName.toLowerCase());
    if (member) {
      return { principal: member.principal, name: member.name };
    }
    return null;
  };

  const parseCSV = (data: string): PreviewTask[] => {
    const lines = data.trim().split('\n');
    const tasks: PreviewTask[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',').map((p) => p.trim());
      if (parts.length < 5) {
        tasks.push({
          clientName: parts[0] || '',
          title: parts[1] || '',
          taskType: parts[2] || '',
          subType: parts[3] || '',
          status: parts[4] || '',
          comment: parts[5] || '',
          assignedName: parts[6] || '',
          dueDate: parts[7] || '',
          assignmentDate: parts[8] || '',
          bill: parts[9] || '',
          advanceReceived: parts[10] || '',
          paymentStatus: parts[11] || 'pending',
          error: `Invalid format on line ${i + 1}. Expected: ClientName, Title, TaskType, SubType, Status, Comment, AssignedName, DueDate, AssignmentDate, Bill, AdvanceReceived, PaymentStatus`,
        });
        continue;
      }

      const [clientName, title, taskType, subType, status, comment = '', assignedName, dueDate = '', assignmentDate = '', bill = '', advanceReceived = '', paymentStatus = 'pending'] = parts;
      const errors: string[] = [];

      if (!validateClientName(clientName)) errors.push('Client not found');
      if (!title) errors.push('Title required');
      if (!validateTaskType(taskType)) errors.push('Invalid Task Type');
      if (!validateStatus(status)) errors.push('Invalid Status');
      if (!findTeamMemberByName(assignedName)) errors.push('Team member not found');
      if (paymentStatus && !validatePaymentStatus(paymentStatus)) errors.push('Invalid Payment Status');

      tasks.push({
        clientName,
        title,
        taskType,
        subType,
        status,
        comment,
        assignedName,
        dueDate,
        assignmentDate,
        bill,
        advanceReceived,
        paymentStatus,
        error: errors.length > 0 ? errors.join(', ') : undefined,
      });
    }

    return tasks;
  };

  const handleCSVPreview = () => {
    setError('');
    if (!csvData.trim()) {
      setError('Please enter CSV data');
      return;
    }

    const tasks = parseCSV(csvData);
    if (tasks.length === 0) {
      setError('No valid tasks found in CSV data');
      return;
    }

    setPreviewData(tasks);
    setShowPreview(true);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await parseExcelFile(file);
      const tasks: PreviewTask[] = [];
      const startRow = rows[0] && typeof rows[0][0] === 'string' && rows[0][0].toLowerCase().includes('client') ? 1 : 0;

      for (let i = startRow; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const clientName = String(row[0] || '').trim();
        const title = String(row[1] || '').trim();
        const taskType = String(row[2] || '').trim();
        const subType = String(row[3] || '').trim();
        const status = String(row[4] || 'pending').trim();
        const comment = String(row[5] || '').trim();
        const assignedName = String(row[6] || '').trim();
        const dueDate = String(row[7] || '').trim();
        const assignmentDate = String(row[8] || '').trim();
        const bill = String(row[9] || '').trim();
        const advanceReceived = String(row[10] || '').trim();
        const paymentStatus = String(row[11] || 'pending').trim();

        const errors: string[] = [];
        if (!validateClientName(clientName)) errors.push('Client not found');
        if (!title) errors.push('Title required');
        if (!validateTaskType(taskType)) errors.push('Invalid Task Type');
        if (!validateStatus(status)) errors.push('Invalid Status');
        if (!findTeamMemberByName(assignedName)) errors.push('Team member not found');
        if (paymentStatus && !validatePaymentStatus(paymentStatus)) errors.push('Invalid Payment Status');

        tasks.push({
          clientName,
          title,
          taskType,
          subType,
          status,
          comment,
          assignedName,
          dueDate,
          assignmentDate,
          bill,
          advanceReceived,
          paymentStatus,
          error: errors.length > 0 ? errors.join(', ') : undefined,
        });
      }

      if (tasks.length === 0) {
        setError('No valid tasks found in file');
        return;
      }

      setPreviewData(tasks);
      setShowPreview(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleImport = async () => {
    const validTasks = previewData.filter((t) => !t.error);
    if (validTasks.length === 0) {
      setError('No valid tasks to import');
      return;
    }

    try {
      const tasks: Task[] = validTasks.map((t) => {
        const member = findTeamMemberByName(t.assignedName);
        
        // Convert due date string to nanoseconds timestamp
        let dueDateNano: bigint | undefined = undefined;
        if (t.dueDate && t.dueDate.trim()) {
          try {
            const dateObj = new Date(t.dueDate.trim());
            if (!isNaN(dateObj.getTime())) {
              dueDateNano = BigInt(dateObj.getTime()) * BigInt(1000000);
            }
          } catch (e) {
            console.warn('Invalid due date:', t.dueDate);
          }
        }

        // Convert manual assignment date string to nanoseconds timestamp
        let manualAssignmentDateNano: bigint | undefined = undefined;
        if (t.assignmentDate && t.assignmentDate.trim()) {
          try {
            const dateObj = new Date(t.assignmentDate.trim());
            if (!isNaN(dateObj.getTime())) {
              manualAssignmentDateNano = BigInt(dateObj.getTime()) * BigInt(1000000);
            }
          } catch (e) {
            console.warn('Invalid assignment date:', t.assignmentDate);
          }
        }

        // Parse advance received amount
        let advanceReceivedAmount: bigint | undefined = undefined;
        if (t.advanceReceived && t.advanceReceived.trim()) {
          try {
            const amount = parseInt(t.advanceReceived.trim(), 10);
            if (!isNaN(amount) && amount >= 0) {
              advanceReceivedAmount = BigInt(amount);
            }
          } catch (e) {
            console.warn('Invalid advance received amount:', t.advanceReceived);
          }
        }

        return {
          id: 0,
          clientId: 0,
          clientName: t.clientName.trim(),
          title: t.title.trim(),
          taskType: validateTaskType(t.taskType)!,
          status: validateStatus(t.status)!,
          comment: t.comment.trim() || undefined,
          assignedTo: member!.principal,
          assignedName: member!.name,
          createdAt: BigInt(0),
          recurring: Type__1.none,
          subType: t.subType.trim() || undefined,
          dueDate: dueDateNano,
          assignmentDate: undefined,
          completionDate: undefined,
          manualAssignmentDate: manualAssignmentDateNano,
          bill: t.bill.trim() || undefined,
          paymentStatus: validatePaymentStatus(t.paymentStatus) || Type.pending,
          advanceReceived: advanceReceivedAmount,
          outstandingAmount: undefined,
        };
      });

      await bulkImportTasks.mutateAsync(tasks);
      
      // Show success message with count
      toast.success(`Successfully imported ${validTasks.length} task${validTasks.length !== 1 ? 's' : ''}`);
      
      // Reset state and close dialog
      setCsvData('');
      setError('');
      setPreviewData([]);
      setShowPreview(false);
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to import tasks: ${errorMessage}`);
      toast.error(`Import failed: ${errorMessage}`);
    }
  };

  const handleCancel = () => {
    setCsvData('');
    setError('');
    setPreviewData([]);
    setShowPreview(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Tasks</DialogTitle>
          <DialogDescription>
            Import multiple tasks using CSV or Excel format
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <Tabs defaultValue="excel" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="excel">Excel Upload</TabsTrigger>
              <TabsTrigger value="csv">CSV Input</TabsTrigger>
            </TabsList>

            <TabsContent value="excel" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Upload Excel File (.xlsx, .xls, .csv)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTaskTemplate(clients, teamMembers)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelUpload}
                  className="cursor-pointer"
                />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium">Excel Format:</p>
                  <p>Column A: Client Name (required, must match existing client)</p>
                  <p>Column B: Title (required)</p>
                  <p>Column C: Task Type (GST/Audit/IT Notice/TDS/Accounts/Form Filing/CA Certificate/Other, required)</p>
                  <p>Column D: Sub Type (optional)</p>
                  <p>Column E: Status (Pending/In Progress/Completed, optional, defaults to Pending)</p>
                  <p>Column F: Comment (optional, task notes)</p>
                  <p>Column G: Assigned Name (team member name, required)</p>
                  <p>Column H: Due Date (optional, format: YYYY-MM-DD)</p>
                  <p>Column I: Assignment Date (optional, format: YYYY-MM-DD)</p>
                  <p>Column J: Bill (optional, numeric amount)</p>
                  <p>Column K: Advance Received (optional, numeric amount)</p>
                  <p>Column L: Payment Status (Pending/Paid/Overdue, optional, defaults to Pending)</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="csv" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv">CSV Data</Label>
                  <Textarea
                    id="csv"
                    placeholder="ABC Enterprises Ltd, Tax Filing, GST, GST Return, Pending, Initial review completed, John Doe, 2026-03-31, 2026-01-15, 50000, 25000, Pending&#10;XYZ Consultants Pvt Ltd, Annual Audit, Audit, Internal Audit, In Progress, Awaiting final documents, Jane Smith, 2026-04-15, 2026-02-01, 100000, 100000, Paid"
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Format:</p>
                  <p>Client Name, Title, Task Type, Sub Type, Status, Comment, Assigned Name, Due Date, Assignment Date, Bill, Advance Received, Payment Status</p>
                  <p className="mt-2">Task Types: GST, Audit, IT Notice, TDS, Accounts, Form Filing, CA Certificate, Other</p>
                  <p>Status: Pending, In Progress, Completed (defaults to Pending)</p>
                  <p>Client Name: Must match existing client (case-insensitive)</p>
                  <p>Comment: Optional task notes (appears after Status)</p>
                  <p>Assigned Name: Team member name (must match existing team member)</p>
                  <p>Due Date: Format YYYY-MM-DD (e.g., 2026-03-31)</p>
                  <p>Assignment Date: Format YYYY-MM-DD (e.g., 2026-01-15) - optional manual assignment date</p>
                  <p>Bill: Numeric amount (e.g., 50000)</p>
                  <p>Advance Received: Numeric amount (e.g., 25000)</p>
                  <p>Payment Status: Pending, Paid, Overdue (defaults to Pending)</p>
                </div>
                <Button onClick={handleCSVPreview} className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Preview Data
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview ({previewData.length} tasks)</h3>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                Back to Upload
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium">Client Name</th>
                      <th className="text-left p-2 font-medium">Title</th>
                      <th className="text-left p-2 font-medium">Type</th>
                      <th className="text-left p-2 font-medium">Sub Type</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Comment</th>
                      <th className="text-left p-2 font-medium">Assigned To</th>
                      <th className="text-left p-2 font-medium">Due Date</th>
                      <th className="text-left p-2 font-medium">Assign Date</th>
                      <th className="text-left p-2 font-medium">Bill</th>
                      <th className="text-left p-2 font-medium">Advance</th>
                      <th className="text-left p-2 font-medium">Payment</th>
                      <th className="text-left p-2 font-medium">Validation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((task, idx) => (
                      <tr key={idx} className={task.error ? 'bg-destructive/10' : ''}>
                        <td className="p-2 border-t">{task.clientName}</td>
                        <td className="p-2 border-t">{task.title}</td>
                        <td className="p-2 border-t">{task.taskType}</td>
                        <td className="p-2 border-t">{task.subType || '-'}</td>
                        <td className="p-2 border-t">{task.status}</td>
                        <td className="p-2 border-t max-w-[150px] truncate">{task.comment || '-'}</td>
                        <td className="p-2 border-t">{task.assignedName}</td>
                        <td className="p-2 border-t">{task.dueDate || '-'}</td>
                        <td className="p-2 border-t">{task.assignmentDate || '-'}</td>
                        <td className="p-2 border-t">{task.bill || '-'}</td>
                        <td className="p-2 border-t">{task.advanceReceived || '-'}</td>
                        <td className="p-2 border-t">{task.paymentStatus || 'Pending'}</td>
                        <td className="p-2 border-t">
                          {task.error ? (
                            <span className="text-destructive text-xs">{task.error}</span>
                          ) : (
                            <span className="text-green-600 text-xs">✓ Valid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {previewData.filter((t) => !t.error).length} valid tasks will be imported
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {showPreview && (
            <Button
              onClick={handleImport}
              disabled={bulkImportTasks.isPending || previewData.filter((t) => !t.error).length === 0}
            >
              {bulkImportTasks.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${previewData.filter((t) => !t.error).length} Tasks`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
