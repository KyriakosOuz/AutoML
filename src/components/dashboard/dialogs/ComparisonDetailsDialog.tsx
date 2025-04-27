
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { API_BASE_URL } from '@/lib/constants';
import { handleApiResponse, getAuthHeaders } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, RefreshCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ComparisonDetailsDialogProps {
  comparison: {
    comparison_id: string;
    name: string;
    experiment_ids: string[];
    task_type: string;
  };
  open: boolean;
  onClose: () => void;
}

interface ExperimentBasic {
  experiment_id: string;
  experiment_name: string;
  algorithm: string;
  metrics?: Record<string, number>;
  status: 'running' | 'completed' | 'failed' | 'success';
}

interface ComparisonDetails {
  experiments: ExperimentBasic[];
  metrics_comparison?: Record<string, Record<string, number>>;
  created_at: string;
  task_type: string;
}

const ComparisonDetailsDialog: React.FC<ComparisonDetailsDialogProps> = ({
  comparison,
  open,
  onClose
}) => {
  const [details, setDetails] = useState<ComparisonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchComparisonDetails();
    }
  }, [open]);

  const fetchComparisonDetails = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/comparisons/compare/`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          experiment_ids: comparison.experiment_ids,
          task_type: comparison.task_type
        })
      });
      
      const result = await handleApiResponse<ComparisonDetails>(response);
      setDetails(result.data);
    } catch (error) {
      console.error('Error fetching comparison details:', error);
      toast({
        title: 'Failed to load comparison details',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
      setDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const formatMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return Number(value).toFixed(4);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{comparison.name}</DialogTitle>
            <Badge variant="outline">{comparison.task_type}</Badge>
          </div>
          <DialogDescription>
            Comparison of {comparison.experiment_ids.length} experiments
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto mt-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !details ? (
            <div className="text-center py-8 text-muted-foreground">
              Failed to load comparison details.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Experiment</TableHead>
                      <TableHead>Algorithm</TableHead>
                      {details.metrics_comparison && Object.keys(Object.values(details.metrics_comparison)[0] || {}).map((metric) => (
                        <TableHead key={metric}>{metric.replace(/_/g, ' ')}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.experiments.map((experiment) => (
                      <TableRow key={experiment.experiment_id}>
                        <TableCell className="font-medium">{experiment.experiment_name}</TableCell>
                        <TableCell>{experiment.algorithm}</TableCell>
                        {details.metrics_comparison && 
                          details.metrics_comparison[experiment.experiment_id] &&
                          Object.entries(details.metrics_comparison[experiment.experiment_id]).map(([metric, value]) => (
                            <TableCell key={metric}>
                              {formatMetric(value)}
                            </TableCell>
                          ))
                        }
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Display a message if there is no metrics comparison data */}
              {(!details.metrics_comparison || Object.keys(details.metrics_comparison).length === 0) && (
                <div className="text-center py-4 text-muted-foreground">
                  No metrics data available for comparison.
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="pt-4">
          <div className="flex gap-2 mr-auto">
            <Button 
              variant="outline"
              onClick={fetchComparisonDetails}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Button>
              <BarChart3 className="h-4 w-4 mr-2" />
              View Charts
            </Button>
          </div>
          
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ComparisonDetailsDialog;
