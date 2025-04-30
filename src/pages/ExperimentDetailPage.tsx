
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import ExperimentResultsContainer from '@/components/experiments/ExperimentResultsContainer';
import { checkStatus } from '@/lib/training';
import { useToast } from '@/hooks/use-toast';

const ExperimentDetailPage: React.FC = () => {
  const { experimentId } = useParams<{ experimentId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'running' | 'completed' | 'failed' | 'success'>('processing');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    if (experimentId) {
      fetchExperimentStatus();
    }
  }, [experimentId]);
  
  const fetchExperimentStatus = async () => {
    if (!experimentId) return;
    
    try {
      setIsLoading(true);
      const statusResponse = await checkStatus(experimentId);
      
      if (statusResponse?.data) {
        setStatus(statusResponse.data.status as any);
      }
    } catch (error) {
      console.error("Error fetching experiment status:", error);
      toast({
        title: "Error",
        description: "Failed to fetch experiment status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const goBack = () => {
    navigate('/training');
  };
  
  const handleRefresh = () => {
    fetchExperimentStatus();
  };
  
  return (
    <div className="container py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={goBack} className="mr-2 sm:mr-4 p-2 sm:p-3">
            <ChevronLeft className="h-4 w-4 mr-0 sm:mr-1" />
            <span className="hidden sm:inline">Back to Training</span>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Experiment Results</h1>
        </div>
        
        <Button variant="outline" onClick={handleRefresh} size="sm" className="w-full sm:w-auto mt-2 sm:mt-0">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <ExperimentResultsContainer 
          experimentId={experimentId || null} 
          status={status}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
};

export default ExperimentDetailPage;
