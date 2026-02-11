import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useBulkImportClients } from '../hooks/useQueries';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Download, Upload } from 'lucide-react';
import { Type__1, Type__3, Type__4, type Client } from '../backend';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { downloadClientTemplate, parseExcelFile } from '../lib/excelTemplates';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PreviewClient {
  name: string;
  gstin?: string;
  pan?: string;
  taskCategory: string;
  subCategory?: string;
  recurring: string;
  error?: string;
}

export default function BulkImportDialog({ open, onOpenChange }: BulkImportDialogProps) {
  const [csvData, setCsvData] = useState('');
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState<PreviewClient[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const bulkImportClients = useBulkImportClients();

  const parseTaskCategory = (category: string): Type__3 => {
    const normalized = category.toLowerCase().trim();
    if (normalized === 'gst') return Type__3.GST;
    if (normalized === 'audit') return Type__3.Audit;
    if (normalized === 'it notice' || normalized === 'itnotice') return Type__3.ITNotice;
    if (normalized === 'tds') return Type__3.TDS;
    return Type__3.Other;
  };

  const parseRecurring = (recurring: string): Type__1 => {
    const normalized = recurring.toLowerCase().trim();
    if (normalized === 'monthly') return Type__1.monthly;
    if (normalized === 'quarterly') return Type__1.quarterly;
    if (normalized === 'yearly') return Type__1.yearly;
    return Type__1.none;
  };

  const parseCSV = (data: string): PreviewClient[] => {
    const lines = data.trim().split('\n');
    const clients: PreviewClient[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      
      if (parts.length < 1 || !parts[0]) {
        clients.push({
          name: '',
          taskCategory: 'Other',
          recurring: 'None',
          error: `Invalid format on line ${i + 1}. Name of Client is required.`,
        });
        continue;
      }

      const [name, gstin, pan, taskCategory, subCategory, recurring] = parts;

      clients.push({
        name,
        gstin: gstin || undefined,
        pan: pan || undefined,
        taskCategory: taskCategory || 'Other',
        subCategory: subCategory || undefined,
        recurring: recurring || 'None',
      });
    }

    return clients;
  };

  const handleCSVPreview = () => {
    setError('');
    if (!csvData.trim()) {
      setError('Please enter CSV data');
      return;
    }

    const clients = parseCSV(csvData);
    if (clients.length === 0) {
      setError('No valid clients found in CSV data');
      return;
    }

    setPreviewData(clients);
    setShowPreview(true);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await parseExcelFile(file);
      const clients: PreviewClient[] = [];
      
      // Skip header row if it exists
      const startRow = rows[0] && typeof rows[0][0] === 'string' && rows[0][0].toLowerCase().includes('name') ? 1 : 0;

      for (let i = startRow; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const name = String(row[0] || '').trim();
        const gstin = String(row[1] || '').trim();
        const pan = String(row[2] || '').trim();
        const taskCategory = String(row[3] || 'Other').trim();
        const subCategory = String(row[4] || '').trim();
        const recurring = String(row[5] || 'None').trim();

        if (!name) {
          clients.push({
            name: '',
            gstin: gstin || undefined,
            pan: pan || undefined,
            taskCategory: taskCategory || 'Other',
            subCategory: subCategory || undefined,
            recurring: recurring || 'None',
            error: `Missing required field "Name of Client" on row ${i + 1}`,
          });
          continue;
        }

        clients.push({
          name,
          gstin: gstin || undefined,
          pan: pan || undefined,
          taskCategory: taskCategory || 'Other',
          subCategory: subCategory || undefined,
          recurring: recurring || 'None',
        });
      }

      if (clients.length === 0) {
        setError('No valid clients found in Excel file');
        return;
      }

      setPreviewData(clients);
      setShowPreview(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleImport = () => {
    const validClients = previewData.filter((c) => !c.error);
    if (validClients.length === 0) {
      setError('No valid clients to import');
      return;
    }

    const clients: Client[] = validClients.map((c) => ({
      id: 0,
      name: c.name,
      contactInfo: '', // Not in new template, set to empty
      status: Type__4.active,
      gstin: c.gstin,
      pan: c.pan,
      taskCategory: parseTaskCategory(c.taskCategory),
      subCategory: c.subCategory,
      recurring: parseRecurring(c.recurring),
    }));

    bulkImportClients.mutate(clients, {
      onSuccess: () => {
        setCsvData('');
        setError('');
        setPreviewData([]);
        setShowPreview(false);
        onOpenChange(false);
      },
    });
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
          <DialogTitle>Bulk Import Clients</DialogTitle>
          <DialogDescription>
            Import multiple clients using CSV or Excel format with enhanced client information
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
                    onClick={downloadClientTemplate}
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
                <div className="text-sm text-muted-foreground space-y-1 bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium text-foreground mb-2">Excel Format:</p>
                  <p><span className="font-medium">Column A:</span> Name of Client (required)</p>
                  <p><span className="font-medium">Column B:</span> GSTIN (optional)</p>
                  <p><span className="font-medium">Column C:</span> PAN (optional)</p>
                  <p><span className="font-medium">Column D:</span> Task Category (optional - GST, Audit, IT Notice, TDS, Others)</p>
                  <p><span className="font-medium">Column E:</span> Sub Category (optional)</p>
                  <p><span className="font-medium">Column F:</span> Recurring of Task (optional - Monthly, Quarterly, Yearly)</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="csv" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv">CSV Data</Label>
                  <Textarea
                    id="csv"
                    placeholder="ABC Enterprises Ltd, 27AABCU9603R1ZM, AABCU9603R, GST, GST Return Filing, Monthly&#10;XYZ Consultants Pvt Ltd, 29AACFX1234A1Z5, AACFX1234A, Audit, Internal Audit, Yearly"
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium text-foreground mb-2">Format:</p>
                  <p>Name of Client, GSTIN, PAN, Task Category, Sub Category, Recurring of Task</p>
                  <p className="mt-2 text-xs">Only "Name of Client" is required. All other fields are optional.</p>
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
              <h3 className="text-lg font-semibold">Preview ({previewData.length} clients)</h3>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                Back to Upload
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium">Name</th>
                      <th className="text-left p-2 font-medium">GSTIN</th>
                      <th className="text-left p-2 font-medium">PAN</th>
                      <th className="text-left p-2 font-medium">Category</th>
                      <th className="text-left p-2 font-medium">Sub Category</th>
                      <th className="text-left p-2 font-medium">Recurring</th>
                      <th className="text-left p-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((client, idx) => (
                      <tr key={idx} className={client.error ? 'bg-destructive/10' : ''}>
                        <td className="p-2 border-t">{client.name}</td>
                        <td className="p-2 border-t">{client.gstin || '-'}</td>
                        <td className="p-2 border-t">{client.pan || '-'}</td>
                        <td className="p-2 border-t">{client.taskCategory}</td>
                        <td className="p-2 border-t">{client.subCategory || '-'}</td>
                        <td className="p-2 border-t">{client.recurring}</td>
                        <td className="p-2 border-t">
                          {client.error ? (
                            <span className="text-destructive text-xs">{client.error}</span>
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
              {previewData.filter((c) => !c.error).length} valid clients will be imported
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
              disabled={bulkImportClients.isPending || previewData.filter((c) => !c.error).length === 0}
            >
              {bulkImportClients.isPending ? 'Importing...' : `Import ${previewData.filter((c) => !c.error).length} Clients`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
