import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Eye, List, Plus, Check, X, Loader, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { API_BASE_URL } from '@/lib/constants';
import { getAuthHeaders, handleApiResponse } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ApiResponse, ExperimentListResponse } from '@/types/api';
import ExperimentDetailDrawer from '../experiments/ExperimentDetailDrawer';

const formatTaskType = (taskType: string): string => {
  const taskTypeMap: Record<string, string> = {
    'binary_classification': 'Binary Classification',
    'multiclass_classification': 'Multiclass Classification',
    'regression': 'Regression'
  };
  
  return taskTypeMap[taskType] || taskType;
};

interface ClassificationReport {
  [key: string]: {
    precision: number;
    recall: number;
    'f1-score': number;
    support: number;
  } | number;
}

interface ExperimentMetrics {
  accuracy?: number;
  f1_score?: number;
  precision?: number;
  recall?: number;
  confusion_matrix?: number[][];
  classification_report?: ClassificationReport;
  r2?: number;
  mae?: number;
  mse?: number;
  rmse?: number;
}

interface Experiment {
  id: string;
  experiment_name: string;
  created_at: string;
  task_type: string;
  algorithm_choice: string;
  status: string;
  metrics: ExperimentMetrics;
  target_column: string;
  auto_tune: boolean;
  dataset_id: string;
  dataset_filename: string;
  has_model: boolean;
  error_message: string | null;
  automl_engine?: string;
}

type TrainingMethod = 'all' | 'automl' | 'custom';
type TaskType = 'all' | 'binary_classification' | 'multiclass_classification' | 'regression';

const ExperimentsTab: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
  const [selectedExperiments, setSelectedExperiments] = useState<string[]>([]);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  
  const [trainingMethod, setTrainingMethod] = useState<TrainingMethod>('all');
  const [taskType, setTaskType] = useState<TaskType>('all');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchExperiments();
    
    const handleRefreshExperiments = () => {
      console.log("Refreshing experiments list after model tuning");
      fetchExperiments();
    };
    
    window.addEventListener('refresh-experiments', handleRefreshExperiments);
    
    return () => {
      window.removeEventListener('refresh-experiments', handleRefreshExperiments);
    };
  }, [trainingMethod, taskType]);

  useEffect(() => {
    setSelectedExperiments([]);
  }, [trainingMethod, taskType]);

  const fetchExperiments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const headers = await getAuthHeaders();
      
      const url = new URL(`${API_BASE_URL}/experiments/search-experiments/`);
      
      if (trainingMethod === 'automl') {
        url.searchParams.append("engine", "mljar,h2o");
      } else if (trainingMethod === 'custom') {
        url.searchParams.append("engine", "custom");
      }
      
      if (taskType !== 'all') {
        url.searchParams.append("task_type", taskType);
      }
      
      url.searchParams.append("limit", "20");
      url.searchParams.append("offset", "0");
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: headers
      });

      const data = await handleApiResponse<ExperimentListResponse>(response);
      console.log('API Response:', data);

      if (data.data.results) {
        setExperiments(data.data.results);
      } else {
        console.error('Unexpected API response structure:', data);
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching experiments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load experiments');
      toast({
        title: "Error",
        description: "Failed to load experiments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToComparison = (experimentId: string) => {
    setSelectedExperiments(prev => {
      if (prev.includes(experimentId)) {
        const newSelected = prev.filter(id => id !== experimentId);
        toast({
          title: "Success",
          description: "Experiment removed from comparison list",
        });
        return newSelected;
      }
      
      toast({
        title: "Success",
        description: "Experiment added to comparison list",
      });
      
      return [...prev, experimentId];
    });
  };

  const handleClearSelection = () => {
    setSelectedExperiments([]);
    toast({
      title: "Selection Cleared",
      description: "All selected experiments have been cleared",
    });
  };

  const handleCompareSelected = async () => {
    if (trainingMethod === 'all') {
      toast({
        title: "Filter Required",
        description: "Please filter experiments by training method before comparing.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedExperiments.length < 2) {
      toast({
        title: "Selection Required",
        description: "Please select at least 2 experiments to compare.",
        variant: "destructive",
      });
      return;
    }
    
    const adHocCompareEvent = new CustomEvent('ad-hoc-compare', {
      detail: { experimentIds: selectedExperiments }
    });
    window.dispatchEvent(adHocCompareEvent);
    
    const comparisonsTab = document.querySelector('[value="comparisons"]') as HTMLButtonElement;
    if (comparisonsTab) {
      comparisonsTab.click();
    }
  };

  const handleDelete = async (experimentId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/experiments/delete-experiment/${experimentId}`, {
        method: 'DELETE',
        headers: headers
      });
      
      if (!response.ok) throw new Error('Failed to delete experiment');
      
      toast({
        title: "Success",
        description: "Experiment deleted successfully",
      });
      
      fetchExperiments();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete experiment",
        variant: "destructive",
      });
    }
  };

  const handleViewExperiment = (experimentId: string) => {
    setSelectedExperimentId(experimentId);
    setIsDetailDrawerOpen(true);
  };

  const handleCloseDetailDrawer = () => {
    setIsDetailDrawerOpen(false);
    setSelectedExperimentId(null);
  };

  const renderMetricValue = (value: number | undefined, isPercentage: boolean = true) => {
    if (typeof value === 'undefined') return 'N/A';
    return isPercentage ? `${(value * 100).toFixed(2)}%` : value.toFixed(4);
  };

  const isCompareButtonEnabled = () => {
    return trainingMethod !== 'all' && selectedExperiments.length >= 2;
  };

  const FilterButtons = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button 
          variant={trainingMethod === 'all' ? "default" : "outline"} 
          onClick={() => setTrainingMethod('all')}
        >
          All
        </Button>
        <Button 
          variant={trainingMethod === 'automl' ? "default" : "outline"} 
          onClick={() => setTrainingMethod('automl')}
        >
          AutoML
        </Button>
        <Button 
          variant={trainingMethod === 'custom' ? "default" : "outline"} 
          onClick={() => setTrainingMethod('custom')}
        >
          Custom Training
        </Button>
      </div>

      <div className="flex gap-2">
        <Button 
          variant={taskType === 'all' ? "default" : "outline"} 
          onClick={() => setTaskType('all')}
        >
          All Types
        </Button>
        <Button 
          variant={taskType === 'binary_classification' ? "default" : "outline"} 
          onClick={() => setTaskType('binary_classification')}
        >
          Binary Classification
        </Button>
        <Button 
          variant={taskType === 'multiclass_classification' ? "default" : "outline"} 
          onClick={() => setTaskType('multiclass_classification')}
        >
          Multiclass Classification
        </Button>
        <Button 
          variant={taskType === 'regression' ? "default" : "outline"} 
          onClick={() => setTaskType('regression')}
        >
          Regression
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchExperiments} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const renderEmptyState = () => {
    if (trainingMethod !== 'all' || taskType !== 'all') {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <List className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Experiments Found</h3>
            <p className="text-center text-gray-500 mb-4 max-w-md">
              No experiments match your current filter criteria. Try different filters or create a new experiment.
            </p>
            <Button variant="outline" onClick={() => { setTrainingMethod('all'); setTaskType('all'); }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Eye className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Experiments Yet</h3>
          <p className="text-center text-gray-500 mb-4 max-w-md">
            Start training models to see your experiments here. You can compare results and manage your models.
          </p>
          <Button asChild>
            <Link to="/training">Start New Training</Link>
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Experiments</h2>
          <p className="text-muted-foreground">View and manage your machine learning experiments</p>
        </div>
        <div className="flex gap-2">
          {selectedExperiments.length > 0 && (
            <>
              <Button 
                variant="outline"
                onClick={handleClearSelection}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Selection
              </Button>
              <Button 
                onClick={handleCompareSelected}
                disabled={!isCompareButtonEnabled()}
              >
                <List className="h-4 w-4 mr-2" />
                Compare ({selectedExperiments.length})
              </Button>
            </>
          )}
          <Button asChild>
            <Link to="/training">
              <Plus className="h-4 w-4 mr-2" />
              New Experiment
            </Link>
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Experiments</CardTitle>
        </CardHeader>
        <CardContent>
          <FilterButtons />
        </CardContent>
      </Card>

      <Card className="mb-6 bg-muted/50">
        <CardContent className="py-4">
          <div className="flex gap-2 text-sm text-muted-foreground">
            <Info className="h-5 w-5 flex-shrink-0" />
            <p>
              Browse and manage your machine learning experiments here. Filter experiments by training method and task type,
              compare multiple experiments, or view detailed results for each experiment. To compare experiments, first select either AutoML
              or Custom Training method (mixing comparison between methods is not allowed), then select your task type. You can then select multiple
              experiments to compare by clicking the compare icon. Click on the view icon to see full metrics,
              or the delete icon to remove an experiment.
            </p>
          </div>
        </CardContent>
      </Card>

      {experiments.length === 0 ? (
        renderEmptyState()
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Experiment Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Algorithm</TableHead>
                  <TableHead>Metrics</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experiments.map((experiment) => {
                  const isRegression = experiment.task_type === 'regression';
                  return (
                    <TableRow key={experiment.id}>
                      <TableCell>{experiment.experiment_name}</TableCell>
                      <TableCell>{formatDistanceToNow(new Date(experiment.created_at))} ago</TableCell>
                      <TableCell>{formatTaskType(experiment.task_type)}</TableCell>
                      <TableCell>{experiment.algorithm_choice}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {isRegression ? (
                            <>
                              <div>R² Score: {renderMetricValue(experiment.metrics?.r2, false)}</div>
                              <div>MAE: {renderMetricValue(experiment.metrics?.mae, false)}</div>
                              <div>MSE: {renderMetricValue(experiment.metrics?.mse, false)}</div>
                              <div>RMSE: {renderMetricValue(experiment.metrics?.rmse, false)}</div>
                            </>
                          ) : (
                            <>
                              <div>Accuracy: {renderMetricValue(experiment.metrics?.accuracy)}</div>
                              <div>F1 Score: {renderMetricValue(experiment.metrics?.f1_score)}</div>
                              <div>Precision: {renderMetricValue(experiment.metrics?.precision)}</div>
                              <div>Recall: {renderMetricValue(experiment.metrics?.recall)}</div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewExperiment(experiment.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant={selectedExperiments.includes(experiment.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleAddToComparison(experiment.id)}
                          >
                            {selectedExperiments.includes(experiment.id) ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <List className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(experiment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ExperimentDetailDrawer
        experimentId={selectedExperimentId}
        isOpen={isDetailDrawerOpen}
        onClose={handleCloseDetailDrawer}
      />
    </div>
  );
};

export default ExperimentsTab;
