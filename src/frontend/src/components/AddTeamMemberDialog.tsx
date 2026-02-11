import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateTeamMember } from '../hooks/useQueries';
import { Principal } from '@dfinity/principal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddTeamMemberDialog({ open, onOpenChange }: AddTeamMemberDialogProps) {
  const [name, setName] = useState('');
  const [principalId, setPrincipalId] = useState('');
  const [error, setError] = useState('');
  const createTeamMember = useCreateTeamMember();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !principalId.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const principal = Principal.fromText(principalId.trim());
      createTeamMember.mutate(
        { name: name.trim(), principal },
        {
          onSuccess: () => {
            setName('');
            setPrincipalId('');
            setError('');
            onOpenChange(false);
          },
          onError: (err: Error) => {
            setError(err.message);
          },
        }
      );
    } catch (err) {
      setError('Invalid Principal ID format');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Enter team member name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="principal">Principal ID</Label>
            <Input
              id="principal"
              placeholder="Enter principal ID"
              value={principalId}
              onChange={(e) => setPrincipalId(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">The Internet Identity principal of the team member</p>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTeamMember.isPending}>
              {createTeamMember.isPending ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
