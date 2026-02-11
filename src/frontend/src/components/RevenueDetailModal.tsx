import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { RevenueCardType, Type } from '../backend';
import { useGetRevenueModalData } from '../hooks/useQueries';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RevenueDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardType: RevenueCardType | null;
}

type SortField = 'taskName' | 'clientName' | 'bill' | 'advanceReceived' | 'outstandingAmount';
type SortDirection = 'asc' | 'desc' | null;

export default function RevenueDetailModal({ open, onOpenChange, cardType }: RevenueDetailModalProps) {
  const { data, isLoading } = useGetRevenueModalData(cardType);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const getTitle = () => {
    if (!cardType) return '';
    switch (cardType) {
      case RevenueCardType.totalRevenue:
        return 'Total Revenue Details';
      case RevenueCardType.totalCollected:
        return 'Total Collected Details';
      case RevenueCardType.totalOutstanding:
        return 'Total Outstanding Details';
      default:
        return 'Revenue Details';
    }
  };

  const getDescription = () => {
    if (!cardType) return '';
    switch (cardType) {
      case RevenueCardType.totalRevenue:
        return 'All tasks with bill amounts';
      case RevenueCardType.totalCollected:
        return 'Tasks with paid status';
      case RevenueCardType.totalOutstanding:
        return 'Tasks with outstanding balance';
      default:
        return '';
    }
  };

  const getPaymentStatusLabel = (status: Type): string => {
    switch (status) {
      case Type.pending:
        return 'Pending';
      case Type.paid:
        return 'Paid';
      case Type.overdue:
        return 'Overdue';
      default:
        return 'Unknown';
    }
  };

  const getPaymentStatusVariant = (status: Type): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case Type.pending:
        return 'default';
      case Type.paid:
        return 'secondary';
      case Type.overdue:
        return 'destructive';
      default:
        return 'default';
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedItems = useMemo(() => {
    if (!data?.items || !sortField || !sortDirection) return data?.items || [];

    const sorted = [...data.items].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'taskName':
          aValue = a.taskName.toLowerCase();
          bValue = b.taskName.toLowerCase();
          break;
        case 'clientName':
          aValue = a.clientName.toLowerCase();
          bValue = b.clientName.toLowerCase();
          break;
        case 'bill':
          aValue = a.bill ? parseFloat(a.bill.replace(/[^0-9.]/g, '')) || 0 : 0;
          bValue = b.bill ? parseFloat(b.bill.replace(/[^0-9.]/g, '')) || 0 : 0;
          break;
        case 'advanceReceived':
          aValue = a.advanceReceived ? Number(a.advanceReceived) : 0;
          bValue = b.advanceReceived ? Number(b.advanceReceived) : 0;
          break;
        case 'outstandingAmount':
          aValue = a.outstandingAmount ? Number(a.outstandingAmount) : 0;
          bValue = b.outstandingAmount ? Number(b.outstandingAmount) : 0;
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
      }
    });

    return sorted;
  }, [data?.items, sortField, sortDirection]);

  const handleExport = () => {
    if (!data?.items || data.items.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      const headers = ['Task Name', 'Client Name', 'Bill', 'Advance Received', 'Outstanding Amount', 'Payment Status'];
      const rows = sortedItems.map((item) => [
        item.taskName,
        item.clientName,
        item.bill || '',
        item.advanceReceived ? item.advanceReceived.toString() : '',
        item.outstandingAmount ? item.outstandingAmount.toString() : '',
        getPaymentStatusLabel(item.paymentStatus),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row
            .map((cell) => {
              const cellStr = String(cell);
              if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }
              return cellStr;
            })
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `revenue_details_${cardType}_${dateStr}.csv`;

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success('Revenue details exported successfully');
    } catch (error) {
      toast.error('Failed to export: ' + (error as Error).message);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">{getTitle()}</DialogTitle>
              <DialogDescription className="mt-1">{getDescription()}</DialogDescription>
            </div>
            <Button onClick={handleExport} disabled={!data?.items || data.items.length === 0} size="sm" className="ml-4">
              <FileDown className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="text-muted-foreground">Loading details...</p>
              </div>
            </div>
          ) : !data?.items || data.items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">No tasks found for this category.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold text-foreground">₹{Number(data.totalAmount).toLocaleString()}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{sortedItems.length} task(s)</p>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 font-semibold hover:bg-transparent"
                          onClick={() => handleSort('taskName')}
                        >
                          Task Name
                          {getSortIcon('taskName')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 font-semibold hover:bg-transparent"
                          onClick={() => handleSort('clientName')}
                        >
                          Client Name
                          {getSortIcon('clientName')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 font-semibold hover:bg-transparent"
                          onClick={() => handleSort('bill')}
                        >
                          Bill
                          {getSortIcon('bill')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 font-semibold hover:bg-transparent"
                          onClick={() => handleSort('advanceReceived')}
                        >
                          Advance Received
                          {getSortIcon('advanceReceived')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 font-semibold hover:bg-transparent"
                          onClick={() => handleSort('outstandingAmount')}
                        >
                          Outstanding
                          {getSortIcon('outstandingAmount')}
                        </Button>
                      </TableHead>
                      <TableHead>Payment Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedItems.map((item, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.taskName}</TableCell>
                        <TableCell>{item.clientName}</TableCell>
                        <TableCell className="text-right font-mono">
                          {item.bill ? `₹${parseFloat(item.bill.replace(/[^0-9.]/g, '') || '0').toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.advanceReceived ? `₹${Number(item.advanceReceived).toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.outstandingAmount ? `₹${Number(item.outstandingAmount).toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPaymentStatusVariant(item.paymentStatus)}>
                            {getPaymentStatusLabel(item.paymentStatus)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
