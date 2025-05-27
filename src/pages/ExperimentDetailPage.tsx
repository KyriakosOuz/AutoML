
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getExperimentResults } from '@/lib/training';
import { useToast } from '@/hooks/use-toast';
import ExperimentSidePanel from '@/components/ai-assistant/ExperimentSidePanel';
import { ExperimentResultsView } from '@/components/training/ExperimentResultsView';

const ExperimentDetailPage: React.FC = () => {
  const { experimentId } = useParams<{ experimentId: string }>();
  const { toast } = useToast();

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
  }, [error, toast]);
  
  // Enhanced debug logging to track new file structure
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
        // Enhanced file type logging for new metadata structure
        fileTypes: data.files?.map(f => ({
          file_type: f.file_type,
          curve_subtype: f.curve_subtype,
          file_url: f.file_url?.split('/').pop() // Just filename for cleaner logging
        })),
        // Specific file type counts
        confusionMatrixFiles: data.files?.filter(f => f.file_type === 'confusion_matrix').length || 0,
        evaluationCurveFiles: data.files?.filter(f => f.file_type === 'evaluation_curve').length || 0,
        learningCurveFiles: data.files?.filter(f => f.file_type === 'learning_curve').length || 0,
        predictionsCsvFiles: data.files?.filter(f => f.file_type === 'predictions_csv').length || 0,
        // ROC and PR curve specific detection
        rocCurves: data.files?.filter(f => f.file_type === 'evaluation_curve' && f.curve_subtype === 'roc').length || 0,
        prCurves: data.files?.filter(f => f.file_type === 'evaluation_curve' && f.curve_subtype === 'precision_recall').length || 0
      });
    }
  }, [data, experimentId]);
  
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
