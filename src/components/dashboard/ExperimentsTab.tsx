import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Eye, List, Plus, Check, X, Loader, Info, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { API_BASE_URL } from '@/lib/constants';
import { getAuthHeaders, handleApiResponse } from '@/lib/utils';
import { ApiResponse, ExperimentListResponse } from '@/types/api';
import ExperimentDetailDrawer from '../experiments/ExperimentDetailDrawer';
import ComparisonResultsView from '../comparison/ComparisonResultsView';
import { Input } from '@/components/ui/input';
import { AutoMLEngineFilter } from '@/types/training';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';

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
  f1?: number;
  'f1-score'?: number; 
  precision?: number;
  recall?: number;
  confusion_matrix?: number[][];
  classification_report?: ClassificationReport;
  r2?: number;
  mae?: number;
  mse?: number;
  rmse?: number;
  // Add H2O specific metrics
  auc?: number;
  logloss?: number;
  aucpr?: number;
  mean_per_class_error?: number | number[][]; // Updated to accept both number and number[][]
  // Add missing properties that were causing TypeScript errors
  specificity?: number;
  mcc?: number;
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
  auto_train: boolean;
  training_type?: 'automl' | 'custom'; // Added this field to match backend response
  dataset_id: string;
  dataset_filename: string;
  has_model: boolean;
  error_message: string | null;
  automl_engine?: string;
}

type TrainingTab = 'automl' | 'custom' | 'all';
type TaskType = 'all' | 'binary_classification' | 'multiclass_classification' | 'regression';

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
    f1?: number;
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

const ExperimentsTab: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
  const [selectedExperiments, setSelectedExperiments] = useState<string[]>([]);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState<TrainingTab>('all');
  const [taskType, setTaskType] = useState<TaskType>('all');
  const [automlEngine, setAutomlEngine] = useState<AutoMLEngineFilter>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [comparisonResults, setComparisonResults] = useState<ComparisonExperiment[]>([]);
  const [isComparisonDialogOpen, setIsComparisonDialogOpen] = useState(false);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [isSavingComparison, setIsSavingComparison] = useState(false);
  
  const { toast } = useToast();

  // Reset automlEngine when activeTab changes
  useEffect(() => {
    setAutomlEngine('all');
  }, [activeTab]);

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
  }, [activeTab, taskType, searchQuery, automlEngine]);

  useEffect(() => {
    setSelectedExperiments([]);
  }, [activeTab, taskType, automlEngine]);

  const fetchExperiments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const headers = await getAuthHeaders();
      
      const url = new URL(`${API_BASE_URL}/experiments/search-experiments/`);
      
      // Apply experiment type filter (engine parameter)
      if (activeTab === 'automl') {
        if (automlEngine === 'all') {
          url.searchParams.append("engine", "mljar,h2o");
        } else {
          url.searchParams.append("engine", automlEngine);
        }
      } else if (activeTab === 'custom') {
        url.searchParams.append("engine", "custom");
      }
      
      // Apply task type filter
      if (taskType !== 'all') {
        url.searchParams.append("task_type", taskType);
      }
      
      // Apply search query
      if (searchQuery) {
        url.searchParams.append("search", searchQuery);
      }
      
      // Add pagination parameters
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

  const saveComparisonToBackend = async (experimentIds: string[]) => {
    try {
      setIsSavingComparison(true);
      const headers = await getAuthHeaders();
      const currentDate = new Date().toLocaleString();
      
      const response = await fetch(`${API_BASE_URL}/comparisons/save/`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Comparison on ${currentDate}`,
          experiment_ids: experimentIds
        })
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Comparison saved to your dashboard.",
        });
      } else {
        throw new Error("Failed to save comparison");
      }
    } catch (err) {
      console.error('Error saving comparison:', err);
      toast({
        title: "Error",
        description: "Failed to save comparison.",
        variant: "destructive",
      });
    } finally {
      setIsSavingComparison(false);
    }
  };

  const handleCompareSelected = async () => {
    // Restore the validation for active tab and task type
    if (taskType === 'all') {
      toast({
        title: "Task Type Required",
        description: "Please select a specific task type before comparing experiments.",
        variant: "destructive",
      });
      return;
    }
    
    if (activeTab === 'all') {
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

    // Add validation to ensure all selected experiments use the same engine
    if (activeTab === 'automl' && automlEngine === 'all') {
      toast({
        title: "Engine Filter Required",
        description: "Please select a specific AutoML engine (MLJAR or H2O) before comparing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoadingComparison(true);
      setComparisonError(null);
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/comparisons/compare/`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experiment_ids: selectedExperiments
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to compare experiments: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Comparison API Response:', data);
      
      if (data && data.comparison) {
        setComparisonResults(data.comparison);
        setIsComparisonDialogOpen(true);
        
        // Save the comparison in the background (non-blocking)
        saveComparisonToBackend(selectedExperiments);
      } else {
        throw new Error('Invalid comparison data format from API');
      }
    } catch (err) {
      console.error('Error comparing experiments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to compare experiments';
      setComparisonError(errorMessage);
      toast({
        title: "Comparison Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingComparison(false);
    }
  };

  const handleCloseComparisonDialog = () => {
    setIsComparisonDialogOpen(false);
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = () => {
    setSearchQuery(searchTerm);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchQuery('');
  };

  // Helper function to get F1 score from either f1, f1_score, or f1-score fields
  const getF1Score = (metrics: ExperimentMetrics): number | undefined => {
    // Check all possible F1 score field names
    if (metrics.f1_score !== undefined) {
      return metrics.f1_score;
    } else if (metrics.f1 !== undefined) {
      return metrics.f1;
    } else if (metrics['f1-score'] !== undefined) {
      return metrics['f1-score'];
    }
    return undefined;
  };

  // Updated renderMetricValue function to handle arrays and non-percentage metrics
  const renderMetricValue = (value: number | number[] | number[][] | undefined, isPercentage: boolean = true) => {
    if (typeof value === 'undefined') return 'N/A';
    
    // Handle array values by taking the first value or averaging
    if (Array.isArray(value)) {
      // For nested arrays like mean_per_class_error sometimes is, flatten and average
      if (Array.isArray(value[0])) {
        // Flatten the nested array and calculate the average
        const flatValues = (value as number[][]).flat();
        const avgValue = flatValues.reduce((acc, val) => acc + val, 0) / flatValues.length;
        return isPercentage ? `${(avgValue * 100).toFixed(2)}%` : avgValue.toFixed(4);
      }
      
      // For simple arrays, calculate average
      const avgValue = (value as number[]).reduce((acc, val) => acc + val, 0) / value.length;
      return isPercentage ? `${(avgValue * 100).toFixed(2)}%` : avgValue.toFixed(4);
    }
    
    // For simple number values
    return isPercentage ? `${(value * 100).toFixed(2)}%` : value.toFixed(4);
  };

  const isCompareButtonEnabled = () => {
    // Restore the check for active tab and task type
    if (activeTab === 'all') return false;
    
    if (taskType === 'all') return false;
    
    // For AutoML experiments, require a specific engine to be selected
    if (activeTab === 'automl' && automlEngine === 'all') return false;
    
    return selectedExperiments.length >= 2;
  };

  const renderTabButtons = () => (
    <div className="flex gap-2">
      <Button 
        variant={activeTab === 'all' ? "default" : "outline"} 
        onClick={() => setActiveTab('all')}
      >
        All
      </Button>
      <Button 
        variant={activeTab === 'automl' ? "default" : "outline"} 
        onClick={() => setActiveTab('automl')}
      >
        AutoML
      </Button>
      <Button 
        variant={activeTab === 'custom' ? "default" : "outline"} 
        onClick={() => setActiveTab('custom')}
      >
        Custom Training
      </Button>
    </div>
  );

  const renderAutoMLEngineFilters = () => {
    if (activeTab !== 'automl') return null;
    
    return (
      <div className="flex flex-col space-y-4">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          AutoML Engine
        </h3>
        <ToggleGroup 
          type="single" 
          value={automlEngine}
          onValueChange={(value: string) => {
            if (value) setAutomlEngine(value as AutoMLEngineFilter);
          }}
          className="justify-start"
        >
          <ToggleGroupItem value="all">All Engines</ToggleGroupItem>
          <ToggleGroupItem value="mljar">MLJAR</ToggleGroupItem>
          <ToggleGroupItem value="h2o">H2O</ToggleGroupItem>
        </ToggleGroup>
      </div>
    );
  };

  const renderTaskTypeFilters = () => (
    <div className="flex flex-col space-y-4">
      <h3 className="text-sm font-medium">Task Type</h3>
      {renderTaskTypeButtons()}
    </div>
  );

  const renderTaskTypeButtons = () => (
    <div className="flex gap-2 flex-wrap">
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
  );

  const renderSearchBar = () => (
    <div className="relative flex w-full max-w-sm items-center">
      <Input
        type="text"
        placeholder="Search experiments..."
        value={searchTerm}
        onChange={handleSearchChange}
        onKeyPress={handleKeyPress}
        className="pl-8 pr-24"
      />
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <div className="absolute right-2 top-1 flex gap-1">
        {searchTerm && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearSearch}
            className="h-7 px-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleSearchSubmit}
          className="h-7"
        >
          <Search className="h-4 w-4 mr-1" />
          Search
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
    if (activeTab !== 'all' || taskType !== 'all' || searchTerm) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <List className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Experiments Found</h3>
            <p className="text-center text-gray-500 mb-4 max-w-md">
              No experiments match your current filter criteria. Try different filters or create a new experiment.
            </p>
            <Button variant="outline" onClick={() => { setActiveTab('all'); setTaskType('all'); setSearchTerm(''); }}>
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
                disabled={!isCompareButtonEnabled() || isLoadingComparison}
              >
                {isLoadingComparison ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <List className="h-4 w-4 mr-2" />
                )}
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
        <CardContent className="space-y-6">
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-medium">Experiment Type</h3>
            {renderTabButtons()}
          </div>
          
          {/* New AutoML engine filters section */}
          {renderAutoMLEngineFilters()}
          
          {renderTaskTypeFilters()}
          
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-medium">Search</h3>
            {renderSearchBar()}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 bg-muted/50">
        <CardContent className="py-4">
          <div className="flex gap-2 text-sm text-muted-foreground">
            <Info className="h-5 w-5 flex-shrink-0" />
            <p>
              Browse and manage your machine learning experiments here. Filter experiments by training method (AutoML or Custom), 
              AutoML engine (MLJAR or H2O), or task type. Search by name, compare multiple experiments, or view detailed results. 
              To compare experiments, first select a specific training method, engine (for AutoML), and task type, 
              then select multiple experiments to compare. Only experiments with the same engine can be compared. 
              Click the view icon for full metrics, or the delete icon to remove an experiment.
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
                  <TableHead>Method/Algorithm</TableHead>
                  <TableHead>Metrics</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experiments.map((experiment) => {
                  const isRegression = experiment.task_type === 'regression';
                  const isH2OExperiment = experiment.automl_engine?.toLowerCase() === 'h2o';
                  const isMLJARExperiment = experiment.automl_engine?.toLowerCase() === 'mljar';
                  const isBinaryClassification = experiment.task_type === 'binary_classification';
                  const isMulticlassClassification = experiment.task_type === 'multiclass_classification';
                  
                  return (
                    <TableRow key={experiment.id}>
                      <TableCell>{experiment.experiment_name}</TableCell>
                      <TableCell>{formatDistanceToNow(new Date(experiment.created_at))} ago</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{formatTaskType(experiment.task_type)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {experiment.training_type === 'automl' || (!experiment.training_type && experiment.auto_train) ? (
                          <span>{experiment.automl_engine ? experiment.automl_engine.toUpperCase() : 'Unknown Engine'}</span>
                        ) : (
                          <span>{experiment.algorithm_choice}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {isRegression ? (
                            <>
                              <div>R² Score: {renderMetricValue(experiment.metrics?.r2, false)}</div>
                              <div>MAE: {renderMetricValue(experiment.metrics?.mae, false)}</div>
                              <div>MSE: {renderMetricValue(experiment.metrics?.mse, false)}</div>
                              <div>RMSE: {renderMetricValue(experiment.metrics?.rmse, false)}</div>
                            </>
                          ) : isH2OExperiment && isBinaryClassification ? (
                            // H2O binary classification metrics
                            <>
                              <div>Accuracy: {renderMetricValue(experiment.metrics?.accuracy)}</div>
                              <div>F1 Score: {renderMetricValue(getF1Score(experiment.metrics))}</div>
                              <div>Precision: {renderMetricValue(experiment.metrics?.precision)}</div>
                              <div>Recall: {renderMetricValue(experiment.metrics?.recall)}</div>
                            </>
                          ) : isH2OExperiment && isMulticlassClassification ? (
                            // H2O multiclass metrics - display the metrics that are actually available
                            <>
                              <div>MSE: {renderMetricValue(experiment.metrics?.mse, false)}</div>
                              <div>RMSE: {renderMetricValue(experiment.metrics?.rmse, false)}</div>
                              <div>Log Loss: {renderMetricValue(experiment.metrics?.logloss, false)}</div>
                              <div>MPCE: {renderMetricValue(experiment.metrics?.mean_per_class_error)}</div>
                            </>
                          ) : isMLJARExperiment && isBinaryClassification ? (
                            // MLJAR binary classification specific metrics
                            <>
                              <div>Accuracy: {renderMetricValue(experiment.metrics?.accuracy)}</div>
                              <div>F1 Score: {renderMetricValue(getF1Score(experiment.metrics))}</div>
                              <div>Precision: {renderMetricValue(experiment.metrics?.precision)}</div>
                              <div>Recall: {renderMetricValue(experiment.metrics?.recall)}</div>
                            </>
                          ) : (
                            // Default classification metrics for other experiments
                            <>
                              <div>Accuracy: {renderMetricValue(experiment.metrics?.accuracy)}</div>
                              <div>F1 Score: {renderMetricValue(getF1Score(experiment.metrics))}</div>
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

      <Dialog open={isComparisonDialogOpen} onOpenChange={handleCloseComparisonDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Experiment Comparison</DialogTitle>
          </DialogHeader>

          {comparisonError ? (
            <Alert variant="destructive">
              <AlertDescription>{comparisonError}</AlertDescription>
            </Alert>
          ) : (
            <div className="mt-4">
              <ComparisonResultsView experiments={comparisonResults} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExperimentsTab;
