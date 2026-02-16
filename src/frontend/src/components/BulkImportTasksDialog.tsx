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
import { parseExcelFile, downloadTaskTemplate } from '../lib/excelTemplates';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

interface BulkImportTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BulkImportTasksDialog({ open, onOpenChange }: BulkImportTasksDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const bulkImport = useBulkImportTasks();
  const { data: clients = [] } = useGetClients();
  const { data: teamMembers = [] } = useGetAllTeamMembers();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setIsProcessing(true);

    try {
      const rows = await parseExcelFile(selectedFile);
      setPreviewData(rows.slice(0, 6));
    } catch (error) {
      setErrors([`Failed to parse file: ${(error as Error).message}`]);
      setPreviewData([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const validateStatus = (statusStr: string): Type__2 | null => {
    const normalized = statusStr.toLowerCase().replace(/\s+/g, '');
    
    if (normalized === 'pending') return Type__2.pending;
    if (normalized === 'inprogress') return Type__2.inProgress;
    if (normalized === 'completed') return Type__2.completed;
    if (normalized === 'docspending') return Type__2.docsPending;
    if (normalized === 'hold') return Type__2.hold;
    
    return null;
  };

  const validateTaskType = (typeStr: string): Type__3 | null => {
    const normalized = typeStr.toLowerCase().replace(/\s+/g, '');
    
    if (normalized === 'gst') return Type__3.GST;
    if (normalized === 'audit') return Type__3.Audit;
    if (normalized === 'itnotice') return Type__3.ITNotice;
    if (normalized === 'tds') return Type__3.TDS;
    if (normalized === 'accounts') return Type__3.Accounts;
    if (normalized === 'formfiling') return Type__3.FormFiling;
    if (normalized === 'cacertificate') return Type__3.CACertificate;
    if (normalized === 'other' || normalized === 'others') return Type__3.Other;
    
    return null;
  };

  const validatePaymentStatus = (statusStr: string): Type | null => {
    const normalized = statusStr.toLowerCase().replace(/\s+/g, '');
    
    if (normalized === 'pending') return Type.pending;
    if (normalized === 'paid') return Type.paid;
    if (normalized === 'overdue') return Type.overdue;
    
    return null;
  };

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrors([]);

    try {
      const rows = await parseExcelFile(file);
      const validationErrors: string[] = [];
      const tasksToImport: Task[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 7 || !row[0]?.trim()) continue;

        const [clientName, title, taskTypeStr, subType, statusStr, comment, assignedName, dueDateStr, assignmentDateStr, billStr, advanceReceivedStr, paymentStatusStr] = row;

        const client = clients.find((c) => c.name.toLowerCase() === clientName.toLowerCase());
        if (!client) {
          validationErrors.push(`Row ${i + 1}: Client "${clientName}" not found`);
          continue;
        }

        const member = teamMembers.find((m) => m.name.toLowerCase() === assignedName.toLowerCase());
        if (!member) {
          validationErrors.push(`Row ${i + 1}: Team member "${assignedName}" not found`);
          continue;
        }

        const taskType = validateTaskType(taskTypeStr);
        if (!taskType) {
          validationErrors.push(`Row ${i + 1}: Invalid task type "${taskTypeStr}"`);
          continue;
        }

        const status = validateStatus(statusStr);
        if (!status) {
          validationErrors.push(`Row ${i + 1}: Invalid status "${statusStr}"`);
          continue;
        }

        const paymentStatus = validatePaymentStatus(paymentStatusStr || 'pending');
        if (!paymentStatus) {
          validationErrors.push(`Row ${i + 1}: Invalid payment status "${paymentStatusStr}"`);
          continue;
        }

        let dueDate: bigint | undefined = undefined;
        if (dueDateStr && dueDateStr.trim()) {
          try {
            const dateObj = new Date(dueDateStr.trim());
            if (!isNaN(dateObj.getTime())) {
              dueDate = BigInt(dateObj.getTime()) * BigInt(1000000);
            }
          } catch (error) {
            validationErrors.push(`Row ${i + 1}: Invalid due date format "${dueDateStr}"`);
            continue;
          }
        }

        let manualAssignmentDate: bigint | undefined = undefined;
        if (assignmentDateStr && assignmentDateStr.trim()) {
          try {
            const dateObj = new Date(assignmentDateStr.trim());
            if (!isNaN(dateObj.getTime())) {
              manualAssignmentDate = BigInt(dateObj.getTime()) * BigInt(1000000);
            }
          } catch (error) {
            validationErrors.push(`Row ${i + 1}: Invalid assignment date format "${assignmentDateStr}"`);
            continue;
          }
        }

        const bill = billStr?.trim() || undefined;
        const advanceReceived = advanceReceivedStr?.trim() ? BigInt(Math.floor(parseFloat(advanceReceivedStr))) : undefined;

        tasksToImport.push({
          id: 0,
          clientId: client.id,
          clientName: client.name,
          title: title.trim(),
          taskType,
          status,
          comment: comment?.trim() || undefined,
          assignedTo: member.principal,
          assignedName: member.name,
          captains: [],
          createdAt: BigInt(Date.now()) * BigInt(1000000),
          recurring: Type__1.none,
          subType: subType?.trim() || undefined,
          bill,
          paymentStatus,
          dueDate,
          assignmentDate: undefined,
          completionDate: undefined,
          manualAssignmentDate,
          advanceReceived,
          outstandingAmount: undefined,
        });
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setIsProcessing(false);
        return;
      }

      if (tasksToImport.length === 0) {
        setErrors(['No valid tasks found in the file']);
        setIsProcessing(false);
        return;
      }

      bulkImport.mutate(tasksToImport, {
        onSuccess: () => {
          toast.success(`Successfully imported ${tasksToImport.length} task${tasksToImport.length !== 1 ? 's' : ''}`);
          onOpenChange(false);
          setFile(null);
          setPreviewData([]);
        },
        onError: (error) => {
          setErrors([`Import failed: ${error.message}`]);
        },
        onSettled: () => {
          setIsProcessing(false);
        },
      });
    } catch (error) {
      setErrors([`Failed to process file: ${(error as Error).message}`]);
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Tasks</DialogTitle>
          <DialogDescription>
            Upload a CSV/Excel file to import multiple tasks at once
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="template">Download Template</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select CSV/Excel File</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={isProcessing || bulkImport.isPending}
              />
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">Validation Errors:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {previewData.length > 0 && (
              <div className="space-y-2">
                <Label>Preview (first 5 rows)</Label>
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {previewData[0].map((header, index) => (
                          <th key={index} className="px-4 py-2 text-left font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(1).map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-2">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="template" className="space-y-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Download the template file to see the required format for bulk import.
              </p>
              <Button onClick={() => downloadTaskTemplate(clients, teamMembers)} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <div className="space-y-2 text-sm">
                <p className="font-medium">Template includes:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Sample data with correct formatting</li>
                  <li>List of available clients and team members</li>
                  <li>Valid values for task types, statuses, and payment statuses</li>
                  <li>Date format examples (YYYY-MM-DD)</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing || bulkImport.isPending}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || isProcessing || bulkImport.isPending}>
            {isProcessing || bulkImport.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {bulkImport.isPending ? 'Importing...' : 'Processing...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import Tasks
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
