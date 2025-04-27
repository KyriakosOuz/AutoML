
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Download, Trash2, RefreshCcw, Save } from 'lucide-react';
import { handleApiResponse, getAuthHeaders } from '@/lib/utils';
import StatusBadge from '@/components/training/StatusBadge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import ExperimentsEmptyState from '../empty-states/ExperimentsEmptyState';
import ExperimentDetailsDialog from '../dialogs/ExperimentDetailsDialog';
import SaveComparisonDialog from '../dialogs/SaveComparisonDialog';

interface Experiment {
  experiment_id: string;
  experiment_name: string;
  task_type: string;
  algorithm: string;
  status: 'running' | 'completed' | 'failed' | 'success';
  created_at: string;
  completed_at: string | null;
  dataset_id: string;
  dataset_name: string;
  model_file_url?: string;
}

const ExperimentsTab: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExperimentIds, setSelectedExperimentIds] = useState<string[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [showExperimentDetails, setShowExperimentDetails] = useState(false);
  const [showSaveComparison, setShowSaveComparison] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/experiments/list-experiments/`, {
        method: 'GET',
        headers
      });
      
      const result = await handleApiResponse<Experiment[]>(response);
      const experimentsArray = result.data?.experiments || [];
      
      if (Array.isArray(experimentsArray)) {
        setExperiments(experimentsArray);
      } else {
        console.warn('Invalid experiments data structure:', result.data);
        setExperiments([]);
      }
    } catch (error) {
      console.error('Error fetching experiments:', error);
      toast({
        title: 'Failed to load experiments',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
      setExperiments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExperiment = async (experimentId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/experiments/delete-experiment/${experimentId}`, {
        method: 'DELETE',
        headers
      });
      
      await handleApiResponse(response);
      toast({
        title: 'Experiment deleted',
        description: 'The experiment has been successfully deleted'
      });
      fetchExperiments(); // Refresh list
      setSelectedExperimentIds(prev => prev.filter(id => id !== experimentId));
    } catch (error) {
      console.error('Error deleting experiment:', error);
      toast({
        title: 'Failed to delete experiment',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleCheckboxChange = (experimentId: string, checked: boolean) => {
    if (checked) {
      setSelectedExperimentIds(prev => [...prev, experimentId]);
    } else {
      setSelectedExperimentIds(prev => prev.filter(id => id !== experimentId));
    }
  };

  const handleViewExperiment = (experiment: Experiment) => {
    setSelectedExperiment(experiment);
    setShowExperimentDetails(true);
  };

  const handleSaveComparison = () => {
    if (selectedExperimentIds.length < 2) {
      toast({
        title: 'Selection required',
        description: 'Please select at least 2 experiments to save a comparison',
        variant: 'destructive'
      });
      return;
    }
    
    // Check if all selected experiments have the same task type
    const selectedExps = experiments.filter(exp => selectedExperimentIds.includes(exp.experiment_id));
    const taskTypes = new Set(selectedExps.map(exp => exp.task_type));
    
    if (taskTypes.size > 1) {
      toast({
        title: 'Incompatible experiments',
        description: 'Selected experiments must have the same task type to compare',
        variant: 'destructive'
      });
      return;
    }
    
    setShowSaveComparison(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
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

  if (experiments.length === 0) {
    return <ExperimentsEmptyState onRefresh={fetchExperiments} />;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          {selectedExperimentIds.length > 0 && (
            <Badge variant="secondary" className="text-sm">
              {selectedExperimentIds.length} selected
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchExperiments}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveComparison}
            disabled={selectedExperimentIds.length < 2}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Comparison
          </Button>
        </div>
      </div>
      
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Task Type</TableHead>
              <TableHead>Algorithm</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dataset</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {experiments.map((experiment) => (
              <TableRow key={experiment.experiment_id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedExperimentIds.includes(experiment.experiment_id)}
                    onCheckedChange={(checked) => handleCheckboxChange(experiment.experiment_id, !!checked)}
                  />
                </TableCell>
                <TableCell className="font-medium">{experiment.experiment_name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {experiment.task_type === 'binary_classification' ? 'Binary' : 
                     experiment.task_type === 'multiclass_classification' ? 'Multiclass' : 
                     'Regression'}
                  </Badge>
                </TableCell>
                <TableCell>{experiment.algorithm}</TableCell>
                <TableCell>
                  <StatusBadge status={experiment.status} />
                </TableCell>
                <TableCell>{experiment.dataset_name}</TableCell>
                <TableCell>{formatDate(experiment.created_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewExperiment(experiment)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {experiment.model_file_url && experiment.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a 
                          href={experiment.model_file_url} 
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Experiment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{experiment.experiment_name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDeleteExperiment(experiment.experiment_id)}
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
      
      {showExperimentDetails && selectedExperiment && (
        <ExperimentDetailsDialog
          experiment={selectedExperiment}
          open={showExperimentDetails}
          onClose={() => setShowExperimentDetails(false)}
        />
      )}
      
      {showSaveComparison && (
        <SaveComparisonDialog
          experimentIds={selectedExperimentIds}
          open={showSaveComparison}
          onClose={() => setShowSaveComparison(false)}
          onSaved={() => {
            setSelectedExperimentIds([]);
            toast({
              title: "Comparison saved",
              description: "You can view it in the Comparisons tab"
            });
          }}
        />
      )}
    </>
  );
};

export default ExperimentsTab;
