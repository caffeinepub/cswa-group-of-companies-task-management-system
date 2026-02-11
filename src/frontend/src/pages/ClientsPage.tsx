import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetClients, useIsCallerAdmin } from '../hooks/useQueries';
import { Plus, Search, Upload, Download } from 'lucide-react';
import ClientTable from '../components/ClientTable';
import AddClientDialog from '../components/AddClientDialog';
import BulkImportDialog from '../components/BulkImportDialog';
import { downloadClientTemplate } from '../lib/excelTemplates';

export default function ClientsPage() {
  const { data: clients = [], isLoading } = useGetClients();
  const { data: isAdmin } = useIsCallerAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactInfo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Client Management</h1>
          <p className="text-muted-foreground text-lg">Manage your consultancy clients</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={downloadClientTemplate} variant="outline" className="shadow-soft">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <Button onClick={() => setShowBulkImport(true)} variant="outline" className="shadow-soft">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
            <Button onClick={() => setShowAddDialog(true)} className="shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        )}
      </div>

      <Card className="shadow-soft-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients by name or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 shadow-inner-soft"
              />
            </div>
          </div>

          <ClientTable clients={filteredClients} />
        </CardContent>
      </Card>

      {showAddDialog && <AddClientDialog open={showAddDialog} onOpenChange={setShowAddDialog} />}
      {showBulkImport && <BulkImportDialog open={showBulkImport} onOpenChange={setShowBulkImport} />}
    </div>
  );
}

