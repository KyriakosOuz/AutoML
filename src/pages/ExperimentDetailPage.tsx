
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getExperimentResults } from '@/lib/training';
import { toast } from '@/hooks/use-toast';
import ExperimentSidePanel from '@/components/ai-assistant/ExperimentSidePanel';
import { ExperimentResultsView } from '@/components/training/ExperimentResultsView';

const ExperimentDetailPage: React.FC = () => {
  const { experimentId } = useParams<{ experimentId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['experiment', experimentId],
    queryFn: () => getExperimentResults(experimentId!),
    enabled: !!experimentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (error) {
      console.error('Failed to load experiment:', error);
      toast({
        title: "Failed to load experiment",
        description: 'Could not fetch experiment results. Please try again.',
        variant: "destructive"
      });
    }
  }, [error]);
  
  // Add debug logging to see what data is available, including visualization types
  useEffect(() => {
    if (data) {
      console.log('ExperimentDetailPage: Experiment data loaded:', {
        id: experimentId,
        automlEngine: data.automl_engine,
        taskType: data.task_type,
        status: data.status,
        model: data.model_display_name,
        metrics: data.metrics ? Object.keys(data.metrics) : [],
        filesCount: data.files?.length,
        fileTypes: data.files?.map(f => f.file_type),
        // Log visualization files (but not CSV or model files)
        visualizationFiles: data.files?.filter(f => {
          const isVisualization = ['pdp_', 'ice_', 'importance', 'confusion_matrix', 'roc_curve', 'shap'].some(type => 
            f.file_type.includes(type)
          );
          const isNotCSV = !f.file_type.includes('csv');
          const isNotModel = !f.file_type.includes('model');
          return isVisualization && isNotCSV && isNotModel;
        }).map(f => f.file_type)
      });
    }
  }, [data, experimentId]);
  
  // Determine the status to pass to ExperimentResultsContainer
  const status = data?.status || (isLoading ? 'processing' : error ? 'failed' : 'completed');
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Experiment Details</h1>
      
      {experimentId && (
        <div className="w-full">
          <ExperimentResultsView experimentId={experimentId} />
        </div>
      )}
      
      <ExperimentSidePanel />
    </div>
  );
};

export default ExperimentDetailPage;
