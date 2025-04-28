
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
    <div className="container py-8">
      <div className="flex items-center mb-6 justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={goBack} className="mr-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Training
          </Button>
          <h1 className="text-2xl font-bold">Experiment Results</h1>
        </div>
        
        <Button variant="outline" onClick={handleRefresh} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <ExperimentResultsContainer 
        experimentId={experimentId || null} 
        status={status}
        onRefresh={handleRefresh}
      />
    </div>
  );
};

export default ExperimentDetailPage;
