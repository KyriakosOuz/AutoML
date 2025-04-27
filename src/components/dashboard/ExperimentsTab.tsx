
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { experimentsApi, Experiment } from '@/lib/dashboardApi';
import { comparisonsApi } from '@/lib/dashboardApi';
import { Download, Eye, Trash2, Settings, Save, Loader } from 'lucide-react';
import { ExperimentResults } from '@/types/training';

// Import the actual ExperimentResults component
import ExperimentResultsComponent from '@/components/experiments/ExperimentResults';

const ExperimentsTab = () => {
  const { toast } = useToast();
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
  const [selectedExperiments, setSelectedExperiments] = useState<string[]>([]);
  const [comparisonName, setComparisonName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [experimentResults, setExperimentResults] = useState<ExperimentResults | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);
  
  const { 
    data: experiments = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['experiments'],
    queryFn: () => experimentsApi.listExperiments(),
  });

  const handleToggleExperiment = (experimentId: string) => {
    setSelectedExperiments(prev => 
      prev.includes(experimentId) 
        ? prev.filter(id => id !== experimentId) 
        : [...prev, experimentId]
    );
  };

  const handleViewResults = async (experimentId: string) => {
    setSelectedExperimentId(experimentId);
    setIsLoadingResults(true);
    setResultsError(null);
    
    try {
      const response = await experimentsApi.getExperimentResults(experimentId);
      const results = response.data as {
        experimentId: string;
        experiment_id: string;
        experiment_name: string;
        status: string;
        task_type: string;
        target_column: string;
        created_at: string;
        completed_at: string;
        metrics: Record<string, any>;
        training_results: {
          metrics: Record<string, any>;
        };
        files: any[];
        algorithm: string;
        model_file_url: string;
      };
      
      // Map API response to ExperimentResults type
      const formattedResults: ExperimentResults = {
        experimentId: results.experimentId || results.experiment_id,
        experiment_id: results.experiment_id,
        experiment_name: results.experiment_name,
        status: results.status as any,  // Convert to ExperimentStatus type
        task_type: results.task_type,
        target_column: results.target_column,
        created_at: results.created_at,
        completed_at: results.completed_at,
        metrics: results.metrics,
        training_results: {
          metrics: results.metrics,
        },
        files: results.files,
        algorithm: results.algorithm,
        model_file_url: results.model_file_url,
      };
      
      setExperimentResults(formattedResults);
    } catch (error) {
      console.error('Error fetching experiment results:', error);
      setResultsError(error instanceof Error ? error.message : 'Failed to fetch results');
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handleSaveComparison = async () => {
    if (selectedExperiments.length < 2) {
      toast({
        title: "Selection Error",
        description: "Please select at least 2 experiments to save as a comparison",
        variant: "destructive",
      });
      return;
    }

    if (!comparisonName.trim()) {
      toast({
        title: "Input Error",
        description: "Please enter a name for your comparison",
        variant: "destructive",
      });
      return;
    }

    try {
      await comparisonsApi.saveComparison(comparisonName, selectedExperiments);
      toast({
        title: "Success",
        description: "Comparison saved successfully",
      });
      setShowSaveDialog(false);
      setComparisonName('');
      setSelectedExperiments([]);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save comparison",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExperiment = async (experimentId: string) => {
    try {
      await experimentsApi.deleteExperiment(experimentId);
      toast({
        title: "Success",
        description: "Experiment deleted successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Delete Error",
        description: error instanceof Error ? error.message : "Failed to delete experiment",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'default'; // Changed from 'success' to 'default' to match Badge variants
      case 'running':
        return 'secondary'; // Changed from 'warning' to 'secondary'
      case 'failed':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading experiments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>
          {error instanceof Error ? error.message : "An error occurred while fetching experiments"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Your Experiments</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowSaveDialog(true)}
            disabled={selectedExperiments.length < 2}
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Comparison
          </Button>
          <Button onClick={() => refetch()}>Refresh</Button>
        </div>
      </div>

      {/* Save Comparison Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Experiments as Comparison</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Selected {selectedExperiments.length} experiments for comparison
              </p>
              <Input 
                placeholder="Enter comparison name" 
                value={comparisonName}
                onChange={(e) => setComparisonName(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveComparison}>Save Comparison</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {experiments.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-muted-foreground mb-4">No experiments found.</p>
            <Button onClick={() => window.location.href = '/training'}>
              Create New Experiment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <span className="sr-only">Select</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Task Type</TableHead>
                <TableHead>Algorithm</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experiments.map((experiment) => (
                <TableRow key={experiment.experiment_id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedExperiments.includes(experiment.experiment_id)}
                      onCheckedChange={() => handleToggleExperiment(experiment.experiment_id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{experiment.experiment_name}</TableCell>
                  <TableCell>{experiment.task_type}</TableCell>
                  <TableCell>{experiment.algorithm}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(experiment.status)}>
                      {experiment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(experiment.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* View Results Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewResults(experiment.experiment_id)}
                            disabled={experiment.status !== 'completed' && experiment.status !== 'success'}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Experiment Results</DialogTitle>
                          </DialogHeader>
                          {selectedExperimentId && (
                            <ExperimentResultsComponent 
                              experimentId={selectedExperimentId}
                              experimentResults={experimentResults}
                              isLoading={isLoadingResults}
                              error={resultsError}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {/* Download Model Button */}
                      {experiment.model_file_url && (
                        <Button variant="outline" size="sm" asChild>
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
                      
                      {/* Tune Model Button */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={experiment.status !== 'completed' && experiment.status !== 'success'}
                        onClick={() => window.location.href = `/training?tune=${experiment.experiment_id}`}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>

                      {/* Delete Experiment Dialog */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Experiment</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this experiment? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteExperiment(experiment.experiment_id)}>
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
        </div>
      )}
    </div>
  );
};

export default ExperimentsTab;
