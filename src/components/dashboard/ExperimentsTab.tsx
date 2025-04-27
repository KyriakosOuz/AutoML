
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart2, 
  RefreshCw, 
  Eye, 
  FileText, 
  Trash2, 
  BarChart4, 
  Check,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAuthHeaders, handleApiResponse } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ExperimentResults from '../experiments/ExperimentResults';
import { ExperimentResults as ExperimentResultsType } from '@/types/training';
import { format } from 'date-fns';

interface Experiment {
  experiment_id: string;
  experiment_name: string;
  created_at: string;
  task_type: string;
  algorithm: string;
  automl_engine: string;
  status: 'completed' | 'running' | 'failed';
  target_column?: string;
}

const ExperimentsTab: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExperiments, setSelectedExperiments] = useState<string[]>([]);
  const [viewingExperiment, setViewingExperiment] = useState<string | null>(null);
  const [experimentResult, setExperimentResult] = useState<ExperimentResultsType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingResult, setLoadingResult] = useState(false);
  const { toast } = useToast();

  const fetchExperiments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/experiments/search-experiments/`, {
        headers
      });
      
      const result = await handleApiResponse<{ experiments: Experiment[] }>(response);
      setExperiments(result.data.experiments || []);
    } catch (err) {
      console.error('Error fetching experiments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load experiments');
      toast({
        title: "Error",
        description: "Failed to load experiments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const handleViewExperiment = async (experimentId: string) => {
    setViewingExperiment(experimentId);
    setLoadingResult(true);
    setDialogOpen(true);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/experiments/experiment-results/${experimentId}`, {
        headers
      });
      
      const result = await handleApiResponse<ExperimentResultsType>(response);
      setExperimentResult(result.data);
    } catch (err) {
      console.error('Error fetching experiment details:', err);
      toast({
        title: "Error",
        description: "Failed to load experiment details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingResult(false);
    }
  };

  const handleDeleteExperiment = async (experimentId: string) => {
    if (!confirm('Are you sure you want to delete this experiment?')) {
      return;
    }
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/experiments/delete-experiment/${experimentId}`, {
        method: 'DELETE',
        headers
      });
      
      await handleApiResponse(response);
      
      // Remove from selection if selected
      if (selectedExperiments.includes(experimentId)) {
        setSelectedExperiments(selectedExperiments.filter(id => id !== experimentId));
      }
      
      // Remove from experiments list
      setExperiments(experiments.filter(exp => exp.experiment_id !== experimentId));
      
      toast({
        title: "Success",
        description: "Experiment deleted successfully",
      });
    } catch (err) {
      console.error('Error deleting experiment:', err);
      toast({
        title: "Error",
        description: "Failed to delete experiment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleSelect = (experimentId: string) => {
    setSelectedExperiments(prev => 
      prev.includes(experimentId) 
        ? prev.filter(id => id !== experimentId) 
        : [...prev, experimentId]
    );
  };

  const handleCompare = async () => {
    if (selectedExperiments.length < 2) {
      toast({
        title: "Error",
        description: "Please select at least 2 experiments to compare",
        variant: "destructive",
      });
      return;
    }
    
    // Check if all selected experiments have the same task type
    const selectedExps = experiments.filter(exp => selectedExperiments.includes(exp.experiment_id));
    const taskTypes = new Set(selectedExps.map(exp => exp.task_type));
    
    if (taskTypes.size > 1) {
      toast({
        title: "Error",
        description: "All experiments must have the same task type for comparison",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/comparisons/compare/`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ experiment_ids: selectedExperiments })
      });
      
      const result = await handleApiResponse(response);
      
      // Navigate to comparison result or display it
      toast({
        title: "Success",
        description: "Comparison created successfully",
      });
      
      // Here you might want to navigate to a comparison view
      // or open a dialog showing the comparison results
    } catch (err) {
      console.error('Error comparing experiments:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to compare experiments",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (e) {
      return dateString;
    }
  };

  const formatTaskType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Check size={12} className="mr-1" />
            Completed
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock size={12} className="mr-1" />
            Running
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle size={12} className="mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        );
    }
  };

  if (loading && experiments.length === 0) {
    return (
      <Card className="border">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 text-gray-400 mb-4 animate-spin" />
          <h3 className="text-lg font-medium mb-2">Loading Experiments</h3>
          <p className="text-center text-gray-500 mb-4 max-w-md">
            Fetching your machine learning experiments...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error && experiments.length === 0) {
    return (
      <Card className="border">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-8 w-8 text-red-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Experiments</h3>
          <p className="text-center text-gray-500 mb-4 max-w-md">
            {error}
          </p>
          <Button onClick={fetchExperiments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
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
            You haven't created any machine learning experiments yet. Start training models to see them here.
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
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Your Experiments</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchExperiments}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {selectedExperiments.length > 0 && (
            <Button onClick={handleCompare}>
              <BarChart4 className="h-4 w-4 mr-2" />
              Compare ({selectedExperiments.length})
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]"></TableHead>
                  <TableHead>Experiment Name</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Task Type</TableHead>
                  <TableHead>Algorithm</TableHead>
                  <TableHead>Engine</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experiments.map((experiment) => (
                  <TableRow key={experiment.experiment_id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedExperiments.includes(experiment.experiment_id)} 
                        onCheckedChange={() => handleToggleSelect(experiment.experiment_id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{experiment.experiment_name}</TableCell>
                    <TableCell>{formatDate(experiment.created_at)}</TableCell>
                    <TableCell>{formatTaskType(experiment.task_type || '')}</TableCell>
                    <TableCell>{experiment.algorithm || 'N/A'}</TableCell>
                    <TableCell>{experiment.automl_engine || 'Custom'}</TableCell>
                    <TableCell>{renderStatusBadge(experiment.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewExperiment(experiment.experiment_id)}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteExperiment(experiment.experiment_id)}
                        >
                          <Trash2 size={16} />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          {viewingExperiment && (
            <ExperimentResults
              experimentId={viewingExperiment}
              status={loadingResult ? "running" : "completed"}
              experimentResults={experimentResult}
              isLoading={loadingResult}
              error={null}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExperimentsTab;
