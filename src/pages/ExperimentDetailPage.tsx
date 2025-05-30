
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
        // Log file types to debug visualization filtering
        fileTypes: data.files?.map(f => f.file_type),
        // Log model and CSV files specifically
        modelFiles: data.files?.filter(f => 
          f.file_type.includes('model') || 
          f.file_url.includes('model')
        ).map(f => f.file_type),
        csvFiles: data.files?.filter(f => 
          f.file_type.includes('csv') || 
          f.file_url.includes('csv')
        ).map(f => f.file_type),
        // Log PDP and ICE visualization files separately
        pdpFiles: data.files?.filter(f => f.file_type.includes('pdp_')).map(f => f.file_type),
        iceFiles: data.files?.filter(f => f.file_type.includes('ice_')).map(f => f.file_type)
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
