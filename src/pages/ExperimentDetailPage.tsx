
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ExperimentResults from '@/components/results/ExperimentResults';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

const ExperimentDetailPage: React.FC = () => {
  const { experimentId } = useParams<{ experimentId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'running' | 'completed' | 'failed' | 'success'>('completed');
  
  const goBack = () => {
    navigate('/training');
  };
  
  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={goBack} className="mr-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Training
        </Button>
        <h1 className="text-2xl font-bold">Experiment Results</h1>
      </div>
      
      <ExperimentResults 
        experimentId={experimentId || null} 
        status={status}
      />
    </div>
  );
};

export default ExperimentDetailPage;
