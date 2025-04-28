import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/constants';
import { getAuthHeaders } from '@/lib/utils';
import { LineChart, Trash2, Eye, AlertTriangle, Loader, Check } from 'lucide-react';
import ComparisonResultsView from '../comparison/ComparisonResultsView';

interface SavedComparison {
  id: string;
  name: string;
  experiment_ids: string[];
  created_at: string;
}

interface ComparisonExperiment {
  experiment_id: string;
  experiment_name: string;
  created_at: string;
  task_type: string;
  algorithm: string;
  engine: string | null;
  metrics: {
    accuracy?: number;
    f1_score?: number;
    precision?: number;
    recall?: number;
    auc?: number;
    r2?: number;
    mae?: number;
    mse?: number;
    rmse?: number;
  };
  dataset_name: string;
}

const ComparisonsTab: React.FC = () => {
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonResults, setComparisonResults] = useState<ComparisonExperiment[] | null>(null);
  const [isComparisonLoading, setIsComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedComparisonId, setSelectedComparisonId] = useState<string | null>(null);
  const [savingComparison, setSavingComparison] = useState(false);
  const [comparisonName, setComparisonName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [currentExperimentIds, setCurrentExperimentIds] = useState<string[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const handleAdHocCompare = (event: CustomEvent) => {
      const experimentIds = event.detail?.experimentIds;
      if (Array.isArray(experimentIds) && experimentIds.length >= 2) {
        setCurrentExperimentIds(experimentIds);
        compareExperiments(experimentIds);
      }
    };

    window.addEventListener('ad-hoc-compare' as any, handleAdHocCompare);
    
    return () => {
      window.removeEventListener('ad-hoc-compare' as any, handleAdHocCompare);
    };
  }, []);

  useEffect(() => {
    fetchSavedComparisons();
  }, []);

  const fetchSavedComparisons = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/comparisons/list/`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch comparisons: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setSavedComparisons(data.comparisons || []);
    } catch (err) {
      console.error('Error fetching saved comparisons:', err);
      setError(err instanceof Error ? err.message : 'Failed to load saved comparisons');
      toast({
        title: "Error",
        description: "Could not load saved comparisons. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const compareExperiments = async (experimentIds: string[]) => {
    if (experimentIds.length < 2) {
      toast({
        title: "Selection Error",
        description: "Please select at least 2 experiments to compare.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsComparisonLoading(true);
      setComparisonError(null);
      setComparisonResults(null);
      
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/comparisons/compare/`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experiment_ids: experimentIds
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Comparison API error:', errorText);
        throw new Error(`Failed to compare experiments: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setComparisonResults(data.comparison || []);
      
      if (!selectedComparisonId) {
        setShowSaveForm(true);
      }
    } catch (err) {
      console.error('Error comparing experiments:', err);
      setComparisonError(err instanceof Error ? err.message : 'Failed to compare experiments');
      toast({
        title: "Comparison Error",
        description: "Could not compare the selected experiments. They might be incompatible or there was a server error.",
        variant: "destructive",
      });
    } finally {
      setIsComparisonLoading(false);
    }
  };

  const handleViewComparison = async (comparison: SavedComparison) => {
    setSelectedComparisonId(comparison.id);
    setComparisonName(comparison.name);
    setShowSaveForm(false);
    setCurrentExperimentIds(comparison.experiment_ids);
    await compareExperiments(comparison.experiment_ids);
  };

  const handleDeleteComparison = (comparisonId: string) => {
    setSelectedComparisonId(comparisonId);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!selectedComparisonId) return;
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/comparisons/delete/${selectedComparisonId}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete comparison: ${response.status} ${response.statusText}`);
      }
      
      toast({
        title: "Success",
        description: "Comparison deleted successfully",
      });
      
      fetchSavedComparisons();
      
      if (comparisonResults && selectedComparisonId) {
        setComparisonResults(null);
        setSelectedComparisonId(null);
      }
    } catch (err) {
      console.error('Error deleting comparison:', err);
      toast({
        title: "Error",
        description: "Failed to delete comparison. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  const handleSaveComparison = async () => {
    if (!comparisonName.trim() || !currentExperimentIds.length) {
      toast({
        title: "Input Required",
        description: "Please provide a name for the comparison.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSavingComparison(true);
      
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/comparisons/save/`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: comparisonName,
          experiment_ids: currentExperimentIds
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save comparison: ${response.status} ${response.statusText}`);
      }
      
      toast({
        title: "Success",
        description: "Comparison saved successfully",
      });
      
      fetchSavedComparisons();
      setShowSaveForm(false);
      setComparisonName('');
    } catch (err) {
      console.error('Error saving comparison:', err);
      toast({
        title: "Error",
        description: "Failed to save comparison. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingComparison(false);
    }
  };

  const handleClearComparison = () => {
    setComparisonResults(null);
    setSelectedComparisonId(null);
    setComparisonName('');
    setShowSaveForm(false);
    setCurrentExperimentIds([]);
  };

  const renderEmptyState = () => (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <LineChart className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Saved Comparisons</h3>
        <p className="text-center text-gray-500 mb-4 max-w-md">
          Compare multiple experiments side by side to evaluate performance differences between models. 
          Go to the Experiments tab, select multiple experiments, and click "Compare".
        </p>
      </CardContent>
    </Card>
  );

  const renderSavedComparisons = () => (
    <Card>
      <CardHeader>
        <CardTitle>Saved Comparisons</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Comparison Name</TableHead>
              <TableHead>Experiments</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {savedComparisons.map(comparison => (
              <TableRow key={comparison.id}>
                <TableCell className="font-medium">{comparison.name}</TableCell>
                <TableCell>{comparison.experiment_ids.length} experiments</TableCell>
                <TableCell>{formatDistanceToNow(new Date(comparison.created_at))} ago</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewComparison(comparison)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteComparison(comparison.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderLoadingState = () => (
    <Card>
      <CardContent className="py-8">
        <div className="flex flex-col items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-gray-500 mb-4" />
          <p className="text-muted-foreground">Loading comparisons...</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderErrorState = () => (
    <Card>
      <CardContent className="py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchSavedComparisons} className="mt-4">
          Retry
        </Button>
      </CardContent>
    </Card>
  );

  const renderComparisonView = () => {
    if (isComparisonLoading) {
      return (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center">
              <Loader className="h-8 w-8 animate-spin text-gray-500 mb-4" />
              <p className="text-muted-foreground">Comparing experiments...</p>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (comparisonError) {
      return (
        <Card>
          <CardContent className="py-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{comparisonError}</AlertDescription>
            </Alert>
            <div className="flex justify-end mt-4">
              <Button onClick={handleClearComparison}>Close</Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (comparisonResults && comparisonResults.length > 0) {
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {selectedComparisonId ? comparisonName : 'Ad-hoc Comparison'}
              </CardTitle>
              <div className="flex space-x-2">
                {showSaveForm && (
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveForm(false)}
                  >
                    Cancel
                  </Button>
                )}
                <Button onClick={handleClearComparison}>Close Comparison</Button>
              </div>
            </CardHeader>
            <CardContent>
              {showSaveForm && (
                <div className="mb-6 flex gap-4 items-center">
                  <Input 
                    placeholder="Enter comparison name" 
                    value={comparisonName}
                    onChange={(e) => setComparisonName(e.target.value)}
                    className="max-w-md"
                  />
                  <Button 
                    onClick={handleSaveComparison}
                    disabled={savingComparison}
                  >
                    {savingComparison ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save Comparison
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              <ComparisonResultsView experiments={comparisonResults} />
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this comparison. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {(comparisonResults || isComparisonLoading || comparisonError) ? (
        renderComparisonView()
      ) : (
        <>
          <div>
            <h2 className="text-2xl font-bold mb-2">Model Comparisons</h2>
            <p className="text-muted-foreground">
              Compare multiple experiments side by side to evaluate performance differences
            </p>
          </div>
          
          {isLoading ? renderLoadingState() :
           error ? renderErrorState() :
           savedComparisons.length === 0 ? renderEmptyState() :
           renderSavedComparisons()}
        </>
      )}
    </div>
  );
};

export default ComparisonsTab;
