
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Eye, 
  Trash2, 
  BarChart4, 
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getAuthHeaders, handleApiResponse } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ExperimentResults from '@/components/experiments/ExperimentResults';
import type { Experiment } from '@/types/experiments';

const ExperimentsTab: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExperiments, setSelectedExperiments] = useState<string[]>([]);
  const [viewingExperiment, setViewingExperiment] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchExperiments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/experiments/search-experiments/`, {
        headers
      });
      
      const result = await handleApiResponse(response);
      setExperiments(result.data.results || []);
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

  const handleViewExperiment = (experimentId: string) => {
    setViewingExperiment(experimentId);
    setDialogOpen(true);
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
      
      setSelectedExperiments(prev => prev.filter(id => id !== experimentId));
      setExperiments(prev => prev.filter(exp => exp.id !== experimentId));
      
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

  if (loading && experiments.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex justify-center items-center py-12">
          <div className="animate-spin mr-2">
            <BarChart4 className="h-8 w-8 text-gray-400" />
          </div>
          <div className="text-lg font-medium">Loading experiments...</div>
        </CardContent>
      </Card>
    );
  }

  if (error && experiments.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-8 w-8 text-red-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Experiments</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchExperiments}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (experiments.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart4 className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Experiments Yet</h3>
          <p className="text-gray-500 max-w-md text-center mb-4">
            You haven't created any machine learning experiments yet. Start training models to see them here.
          </p>
          <Button asChild>
            <a href="/training">Start New Training</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Experiment Name</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Task Type</TableHead>
                <TableHead>Algorithm</TableHead>
                <TableHead>Engine</TableHead>
                <TableHead>Dataset</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experiments.map((experiment) => (
                <TableRow key={experiment.id}>
                  <TableCell className="font-medium">{experiment.experiment_name}</TableCell>
                  <TableCell>{formatDate(experiment.created_at)}</TableCell>
                  <TableCell>{formatTaskType(experiment.task_type)}</TableCell>
                  <TableCell>{experiment.algorithm_choice}</TableCell>
                  <TableCell>{experiment.automl_engine}</TableCell>
                  <TableCell>{experiment.dataset_name}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewExperiment(experiment.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteExperiment(experiment.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          {viewingExperiment && (
            <ExperimentResults
              experimentId={viewingExperiment}
              status="completed"
              onReset={() => setDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExperimentsTab;
