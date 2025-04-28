import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Eye, List, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { API_BASE_URL } from '@/lib/constants';
import { getAuthHeaders } from '@/lib/utils';

interface ClassificationReport {
  [key: string]: {
    precision: number;
    recall: number;
    'f1-score': number;
    support: number;
  } | number;
}

interface ExperimentMetrics {
  accuracy: number;
  f1_score: number;
  precision: number;
  recall: number;
  confusion_matrix?: number[][];
  classification_report?: ClassificationReport;
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

const ExperimentsTab: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [selectedExperiments, setSelectedExperiments] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/experiments/list-experiments/?limit=20&offset=0`, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) throw new Error('Failed to fetch experiments');
      
      const data = await response.json();
      console.log('API Response:', data);

      if (data.status === 'success' && data.data.experiments) {
        setExperiments(data.data.experiments);
      } else {
        console.error('Unexpected API response structure:', data);
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching experiments:', err);
      setError('Failed to load experiments');
      toast({
        title: "Error",
        description: "Failed to load experiments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToComparison = (experimentId: string) => {
    setSelectedExperiments(prev => {
      if (prev.includes(experimentId)) {
        return prev;
      }
      
      toast({
        title: "Success",
        description: "Experiment added to comparison list",
      });
      
      return [...prev, experimentId];
    });
  };

  const handleCompareSelected = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/comparisons/save/`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Comparison ${new Date().toLocaleDateString()}`,
          experiment_ids: selectedExperiments
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Failed to create comparison:", errorData);
        throw new Error('Failed to create comparison');
      }

      toast({
        title: "Success",
        description: "Comparison created successfully",
      });

      setSelectedExperiments([]);
    } catch (err) {
      console.error("Comparison error:", err);
      toast({
        title: "Error",
        description: "Failed to create comparison",
        variant: "destructive",
      });
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

  const handleViewExperiment = async (experimentId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/experiments/experiment-results/${experimentId}`, {
        headers: headers
      });
      
      if (!response.ok) throw new Error('Failed to fetch experiment details');
      
      const data = await response.json();
      const experiment = data.data;
      
      if (experiment) {
        setSelectedExperiment(experiment);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load experiment details",
        variant: "destructive",
      });
    }
  };

  const renderMetricValue = (value: number | undefined) => {
    if (typeof value === 'undefined') return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

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

  if (experiments.length === 0) {
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
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Experiments</h2>
          <p className="text-muted-foreground">View and manage your machine learning experiments</p>
        </div>
        <div className="flex gap-2">
          {selectedExperiments.length > 0 && (
            <Button 
              variant="outline"
              onClick={handleCompareSelected}
              disabled={selectedExperiments.length < 2}
            >
              <List className="h-4 w-4 mr-2" />
              Compare ({selectedExperiments.length})
            </Button>
          )}
          <Button asChild>
            <Link to="/training">
              <Plus className="h-4 w-4 mr-2" />
              New Experiment
            </Link>
          </Button>
        </div>
      </div>

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
                <TableHead>Accuracy</TableHead>
                <TableHead>F1 Score</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experiments.map((experiment) => (
                <TableRow key={experiment.id}>
                  <TableCell>{experiment.experiment_name}</TableCell>
                  <TableCell>{formatDistanceToNow(new Date(experiment.created_at))} ago</TableCell>
                  <TableCell>{experiment.task_type}</TableCell>
                  <TableCell>{experiment.algorithm_choice}</TableCell>
                  <TableCell>{renderMetricValue(experiment.metrics?.accuracy)}</TableCell>
                  <TableCell>{renderMetricValue(experiment.metrics?.f1_score)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedExperiment(experiment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAddToComparison(experiment.id)}
                        disabled={selectedExperiments.includes(experiment.id)}
                      >
                        <List className="h-4 w-4" />
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog 
        open={!!selectedExperiment} 
        onOpenChange={() => setSelectedExperiment(null)}
      >
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              Experiment Details
            </DialogTitle>
          </DialogHeader>
          {selectedExperiment && (
            <div className="grid gap-4">
              <div>
                <h3 className="font-semibold">{selectedExperiment.experiment_name}</h3>
                <p className="text-sm text-muted-foreground">
                  Created {formatDistanceToNow(new Date(selectedExperiment.created_at))} ago
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Configuration</h4>
                  <div className="space-y-1">
                    <p>Task Type: {selectedExperiment.task_type}</p>
                    <p>Algorithm: {selectedExperiment.algorithm_choice}</p>
                    {selectedExperiment.automl_engine && (
                      <p>Engine: {selectedExperiment.automl_engine}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Metrics</h4>
                  <div className="space-y-1">
                    <p>Accuracy: {renderMetricValue(selectedExperiment.metrics?.accuracy)}</p>
                    <p>F1 Score: {renderMetricValue(selectedExperiment.metrics?.f1_score)}</p>
                    <p>Precision: {renderMetricValue(selectedExperiment.metrics?.precision)}</p>
                    <p>Recall: {renderMetricValue(selectedExperiment.metrics?.recall)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExperimentsTab;
