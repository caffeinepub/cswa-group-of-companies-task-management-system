import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddClients } from '../hooks/useQueries';
import { Type__1, Type__3, Type__4 } from '../backend';

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddClientDialog({ open, onOpenChange }: AddClientDialogProps) {
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [status, setStatus] = useState<Type__4>(Type__4.active);
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [taskCategory, setTaskCategory] = useState<Type__3>(Type__3.Other);
  const [subCategory, setSubCategory] = useState('');
  const [recurring, setRecurring] = useState<Type__1>(Type__1.none);
  const addClients = useAddClients();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      addClients.mutate(
        [
          {
            id: 0,
            name: name.trim(),
            contactInfo: contactInfo.trim(),
            status: status,
            gstin: gstin.trim() || undefined,
            pan: pan.trim() || undefined,
            taskCategory: taskCategory,
            subCategory: subCategory.trim() || undefined,
            recurring: recurring,
          },
        ],
        {
          onSuccess: () => {
            setName('');
            setContactInfo('');
            setStatus(Type__4.active);
            setGstin('');
            setPan('');
            setTaskCategory(Type__3.Other);
            setSubCategory('');
            setRecurring(Type__1.none);
            onOpenChange(false);
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Client Name *</Label>
              <Input id="name" placeholder="Enter client name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                placeholder="e.g., 27AABCU9603R1ZM"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                maxLength={15}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pan">PAN</Label>
              <Input
                id="pan"
                placeholder="e.g., AABCU9603R"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskCategory">Task Category</Label>
              <Select value={taskCategory} onValueChange={(value: Type__3) => setTaskCategory(value)}>
                <SelectTrigger id="taskCategory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Type__3.GST}>GST</SelectItem>
                  <SelectItem value={Type__3.Audit}>Audit</SelectItem>
                  <SelectItem value={Type__3.ITNotice}>IT Notice</SelectItem>
                  <SelectItem value={Type__3.TDS}>TDS</SelectItem>
                  <SelectItem value={Type__3.Other}>Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subCategory">Sub Category</Label>
              <Input
                id="subCategory"
                placeholder="e.g., GST Return Filing"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring">Recurring of Task</Label>
              <Select value={recurring} onValueChange={(value: Type__1) => setRecurring(value)}>
                <SelectTrigger id="recurring">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Type__1.none}>None</SelectItem>
                  <SelectItem value={Type__1.monthly}>Monthly</SelectItem>
                  <SelectItem value={Type__1.quarterly}>Quarterly</SelectItem>
                  <SelectItem value={Type__1.yearly}>Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contact Info</Label>
              <Input
                id="contact"
                placeholder="Email or phone number"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: Type__4) => setStatus(value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Type__4.active}>Active</SelectItem>
                  <SelectItem value={Type__4.inactive}>Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addClients.isPending}>
              {addClients.isPending ? 'Adding...' : 'Add Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
