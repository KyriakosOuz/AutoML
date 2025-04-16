
import React from 'react';
import { DatasetProvider, useDataset } from '@/contexts/DatasetContext';
import { TrainingProvider } from '@/contexts/TrainingContext';
import ModelTrainingContent from '@/components/training/ModelTrainingContent';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, RotateCcw, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const StartOverButton = () => {
  const { resetState } = useDataset();
  const { toast } = useToast();
  
  const handleStartOver = () => {
    if (window.confirm('Are you sure you want to start over? This will reset all your dataset processing.')) {
      resetState();
      toast({
        title: "Process Reset",
        description: "All dataset processing has been reset. You can now upload a new dataset.",
        duration: 3000,
      });
    }
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleStartOver}
      className="flex items-center gap-2"
    >
      <RotateCcw className="h-4 w-4" />
      Start Over
    </Button>
  );
};

const ModelTrainingPage: React.FC = () => {
  return (
    <DatasetProvider>
      <TrainingProvider>
        <ModelTrainingContent />
      </TrainingProvider>
    </DatasetProvider>
  );
};

export default ModelTrainingPage;
