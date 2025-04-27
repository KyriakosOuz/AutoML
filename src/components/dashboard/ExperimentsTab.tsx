
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart2, Eye, FileText, Plus, RefreshCw, Trash2, Compare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ExperimentResults from '@/components/results/ExperimentResults';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Experiment {
  id: string;
  experiment_name: string;
  created_at: string;
  task_type: string;
  algorithm_choice: string;
  automl_engine: string;
  auto_tune: boolean;
  status: 'completed' | 'running' | 'failed';
  error_message: string | null;
  dataset_name: string;
  model_file_url: string;
  report_file_url: string;
  metrics: {
    recall?: number;
    accuracy?: number;
    f1_score?: number;
    precision?: number;
    [key: string]: number | undefined;
  };
}

interface ExperimentsResponse {
  results: Experiment[];
}

const ExperimentsTab: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchExperiments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/experiments/search-experiments/');
      if (!response.ok) {
        throw new Error('Failed to fetch experiments');
      }
      const data = await response.json();
      if (data?.data?.results) {
        setExperiments(data.data.results);
      } else {
        setExperiments([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: "Error",
        description: "Failed to load experiments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const handleViewExperiment = (id: string) => {
    setSelectedExperimentId(id);
    setIsDialogOpen(true);
  };

  const handleAddToComparison = (id: string) => {
    if (selectedForComparison.includes(id)) {
      setSelectedForComparison(selectedForComparison.filter(expId => expId !== id));
      toast({
        title: "Removed from comparison",
        description: "Experiment removed from comparison list",
      });
    } else {
      setSelectedForComparison([...selectedForComparison, id]);
      toast({
        title: "Added to comparison",
        description: "Experiment added to comparison list",
      });
    }
  };

  const handleCompare = async () => {
    if (selectedForComparison.length < 2) {
      toast({
        title: "Cannot compare",
        description: "You must select at least 2 experiments",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      selectedForComparison.forEach(id => {
        formData.append('experiment_ids', id);
      });

      const response = await fetch('/comparisons/compare/', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to compare experiments');
      }

      // Handle successful comparison - you could navigate to a results page or show in a modal
      toast({
        title: "Comparison successful",
        description: "Your experiments have been compared",
      });
      
      // Here you could navigate to a comparison results page or show results in a modal
      // For now, we'll just console log the results
      console.log("Comparison results:", data);
      
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to compare experiments',
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin">
            <RefreshCw className="h-12 w-12 text-gray-400 mb-4" />
          </div>
          <h3 className="text-lg font-medium mb-2">Loading Experiments</h3>
          <p className="text-center text-gray-500 mb-4 max-w-md">
            Retrieving your machine learning experiments...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchExperiments}>
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (experiments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart2 className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Experiments Yet</h3>
          <p className="text-center text-gray-500 mb-4 max-w-md">
            You haven't created any machine learning experiments yet. Start your first training to see results here.
          </p>
          <Button asChild>
            <Link to="/training">Start New Training</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Your Experiments</CardTitle>
            <div className="flex items-center gap-2">
              {selectedForComparison.length > 0 && (
                <Badge className="mr-2" variant="outline">
                  {selectedForComparison.length} Experiment{selectedForComparison.length > 1 ? 's' : ''} Selected
                </Badge>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCompare}
                disabled={selectedForComparison.length < 2}
              >
                <Compare className="h-4 w-4 mr-2" />
                Compare
              </Button>
              <Button asChild variant="default" size="sm">
                <Link to="/training">
                  <Plus className="h-4 w-4 mr-2" />
                  New Experiment
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Experiment Name</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Task Type</TableHead>
                  <TableHead>Algorithm</TableHead>
                  <TableHead>Engine</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Metrics</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experiments.map((experiment) => (
                  <TableRow key={experiment.id}>
                    <TableCell className="font-medium">{experiment.experiment_name}</TableCell>
                    <TableCell>{formatDate(experiment.created_at)}</TableCell>
                    <TableCell>{experiment.task_type.replace('_', ' ')}</TableCell>
                    <TableCell>{experiment.algorithm_choice}</TableCell>
                    <TableCell>{experiment.automl_engine}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          experiment.status === 'completed' ? 'default' : 
                          experiment.status === 'running' ? 'outline' : 
                          'destructive'
                        }
                      >
                        {experiment.status.charAt(0).toUpperCase() + experiment.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {experiment.metrics && (
                        <div className="flex flex-col gap-1">
                          {experiment.metrics.accuracy !== undefined && (
                            <span className="text-xs">
                              Accuracy: {(experiment.metrics.accuracy * 100).toFixed(2)}%
                            </span>
                          )}
                          {experiment.metrics.f1_score !== undefined && (
                            <span className="text-xs">
                              F1: {(experiment.metrics.f1_score * 100).toFixed(2)}%
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewExperiment(experiment.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant={selectedForComparison.includes(experiment.id) ? "default" : "ghost"} 
                          size="sm" 
                          onClick={() => handleAddToComparison(experiment.id)}
                        >
                          <Compare className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Experiment Results</DialogTitle>
            <DialogDescription>
              View detailed metrics and visualizations for this experiment
            </DialogDescription>
          </DialogHeader>
          {selectedExperimentId && (
            <div className="mt-4">
              <ExperimentResults 
                experimentId={selectedExperimentId} 
                status="completed"
                onReset={() => setIsDialogOpen(false)} 
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExperimentsTab;
