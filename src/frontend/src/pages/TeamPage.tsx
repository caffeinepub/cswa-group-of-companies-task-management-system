import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetAllTeamMembers, useIsCallerAdmin } from '../hooks/useQueries';
import { Plus, UserCog, Upload, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AddTeamMemberDialog from '../components/AddTeamMemberDialog';
import BulkImportTeamMembersDialog from '../components/BulkImportTeamMembersDialog';
import { downloadTeamMemberTemplate } from '../lib/excelTemplates';

export default function TeamPage() {
  const { data: teamMembers = [], isLoading } = useGetAllTeamMembers();
  const { data: isAdmin } = useIsCallerAdmin();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Team Management</h1>
          <p className="text-muted-foreground text-lg">Manage your consultancy team members</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => downloadTeamMemberTemplate()} className="shadow-soft">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <Button variant="outline" onClick={() => setShowBulkImportDialog(true)} className="shadow-soft">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import Assignees
            </Button>
            <Button onClick={() => setShowAddDialog(true)} className="shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </div>
        )}
      </div>

      <Card className="shadow-soft-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No team members yet. Add your first team member to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => (
                <Card key={member.principal.toString()} className="hover:shadow-soft transition-all duration-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                        <UserCog className="h-7 w-7 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground text-lg">{member.name}</p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          Team Member
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground break-all bg-muted/50 p-2 rounded">
                      <span className="font-medium">Principal:</span> {member.principal.toString().slice(0, 20)}...
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showAddDialog && <AddTeamMemberDialog open={showAddDialog} onOpenChange={setShowAddDialog} />}
      {showBulkImportDialog && (
        <BulkImportTeamMembersDialog open={showBulkImportDialog} onOpenChange={setShowBulkImportDialog} />
      )}
    </div>
  );
}

