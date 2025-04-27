
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Trash2, BarChart3, RefreshCcw } from 'lucide-react';
import { handleApiResponse, getAuthHeaders } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import ComparisonsEmptyState from '../empty-states/ComparisonsEmptyState';
import ComparisonDetailsDialog from '../dialogs/ComparisonDetailsDialog';

interface Comparison {
  comparison_id: string;
  name: string;
  created_at: string;
  experiment_count: number;
  task_type: string;
  experiment_ids: string[];
}

interface ComparisonsResponse {
  comparisons: Comparison[];
}

const ComparisonsTab: React.FC = () => {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComparison, setSelectedComparison] = useState<Comparison | null>(null);
  const [showComparisonDetails, setShowComparisonDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchComparisons();
  }, []);

  const fetchComparisons = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/comparisons/list/`, {
        method: 'GET',
        headers
      });
      
      const result = await handleApiResponse<ComparisonsResponse>(response);
      
      // Check if result.data exists and has a comparisons property that is an array
      if (result.data && Array.isArray(result.data.comparisons)) {
        setComparisons(result.data.comparisons);
      } else if (Array.isArray(result.comparisons)) {
        // Handle case where response has direct comparisons array
        setComparisons(result.comparisons);
      } else {
        console.warn('Invalid comparisons data structure:', result);
        setComparisons([]);
      }
    } catch (error) {
      console.error('Error fetching comparisons:', error);
      toast({
        title: 'Failed to load comparisons',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
      setComparisons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComparison = async (comparisonId: string) => {
    // Ensure we have a valid comparison ID
    if (!comparisonId) {
      toast({
        title: 'Error',
        description: 'Invalid comparison ID',
        variant: 'destructive'
      });
      return;
    }
    
    console.log('Deleting comparison with ID:', comparisonId);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/comparisons/delete/${comparisonId}`, {
        method: 'DELETE',
        headers
      });
      
      await handleApiResponse(response);
      toast({
        title: 'Comparison deleted',
        description: 'The comparison has been successfully deleted'
      });
      fetchComparisons(); // Refresh list
    } catch (error) {
      console.error('Error deleting comparison:', error);
      toast({
        title: 'Failed to delete comparison',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleViewComparison = (comparison: Comparison) => {
    setSelectedComparison(comparison);
    setShowComparisonDetails(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (comparisons.length === 0) {
    return <ComparisonsEmptyState onRefresh={fetchComparisons} />;
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchComparisons}
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Task Type</TableHead>
              <TableHead>Experiments</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparisons.map((comparison) => (
              <TableRow key={comparison.comparison_id}>
                <TableCell className="font-medium">{comparison.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {comparison.task_type === 'binary_classification' ? 'Binary' : 
                     comparison.task_type === 'multiclass_classification' ? 'Multiclass' : 
                     'Regression'}
                  </Badge>
                </TableCell>
                <TableCell>{comparison.experiment_count}</TableCell>
                <TableCell>{formatDate(comparison.created_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewComparison(comparison)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleViewComparison(comparison)}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Compare
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Comparison</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{comparison.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDeleteComparison(comparison.comparison_id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      
      {showComparisonDetails && selectedComparison && (
        <ComparisonDetailsDialog
          comparison={selectedComparison}
          open={showComparisonDetails}
          onClose={() => setShowComparisonDetails(false)}
        />
      )}
    </>
  );
};

export default ComparisonsTab;
