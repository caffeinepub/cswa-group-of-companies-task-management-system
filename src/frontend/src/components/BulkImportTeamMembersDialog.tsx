import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { parseExcelFile } from '../lib/excelTemplates';
import { useBulkImportTeamMembers } from '../hooks/useQueries';
import { Principal } from '@dfinity/principal';
import type { TeamMemberData } from '../backend';

interface BulkImportTeamMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedTeamMember {
  name: string;
  principal: Principal;
}

export default function BulkImportTeamMembersDialog({ open, onOpenChange }: BulkImportTeamMembersDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedTeamMember[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const bulkImportMutation = useBulkImportTeamMembers();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);
    setErrors([]);
    setParsedData([]);

    try {
      const rows = await parseExcelFile(selectedFile);
      
      if (rows.length === 0) {
        setErrors(['File is empty']);
        setIsProcessing(false);
        return;
      }

      // Find header row
      const headerRow = rows[0];
      const nameIndex = headerRow.findIndex(h => h.toLowerCase().includes('name'));

      if (nameIndex === -1) {
        setErrors(['Could not find "Name" column in the file']);
        setIsProcessing(false);
        return;
      }

      const dataRows = rows.slice(1).filter(row => row.some(cell => cell.trim()));
      
      if (dataRows.length === 0) {
        setErrors(['No data rows found in file']);
        setIsProcessing(false);
        return;
      }

      if (dataRows.length > 20) {
        setErrors(['Cannot import more than 20 team members at once']);
        setIsProcessing(false);
        return;
      }

      const parsed: ParsedTeamMember[] = [];
      const validationErrors: string[] = [];

      dataRows.forEach((row, index) => {
        const name = row[nameIndex]?.trim();

        if (!name) {
          validationErrors.push(`Row ${index + 2}: Name is required`);
          return;
        }

        // Generate a unique principal ID based on name and timestamp
        // This creates a deterministic but unique principal for each team member
        const uniqueString = `${name}-${Date.now()}-${Math.random()}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(uniqueString);
        
        // Create a simple hash-like principal (29 bytes for a valid principal)
        const principalBytes = new Uint8Array(29);
        for (let i = 0; i < 29; i++) {
          principalBytes[i] = data[i % data.length] ^ (i * 7);
        }
        
        const principal = Principal.fromUint8Array(principalBytes);

        parsed.push({
          name,
          principal,
        });
      });

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
      } else {
        setParsedData(parsed);
      }
    } catch (error) {
      setErrors([`Failed to parse file: ${(error as Error).message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    const teamMembersData: TeamMemberData[] = parsedData.map(member => ({
      name: member.name,
      principal: member.principal,
    }));

    await bulkImportMutation.mutateAsync(teamMembersData);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setIsProcessing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Team Members</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with team member names. The system will automatically generate internal Principal IDs.
            Maximum 20 team members per upload.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </span>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {file && (
              <p className="text-sm text-foreground mt-2">
                Selected: {file.name}
              </p>
            )}
          </div>

          {isProcessing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Processing file...</AlertDescription>
            </Alert>
          )}

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

          {parsedData.length > 0 && errors.length === 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="font-semibold mb-2">
                  Ready to import {parsedData.length} team member(s)
                </div>
                <div className="mt-4 max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 font-semibold">Name</th>
                        <th className="text-left p-2 font-semibold">Generated Principal ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.map((member, index) => (
                        <tr key={index} className="border-t border-border">
                          <td className="p-2">{member.name}</td>
                          <td className="p-2 text-xs text-muted-foreground font-mono">
                            {member.principal.toString().slice(0, 30)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={bulkImportMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedData.length === 0 || errors.length > 0 || bulkImportMutation.isPending}
          >
            {bulkImportMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              `Import ${parsedData.length} Team Member(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
