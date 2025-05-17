
import React from 'react';
import { useTraining } from '@/contexts/training/TrainingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Award, PieChart } from 'lucide-react';
import ExperimentResultsContainer from '@/components/experiments/ExperimentResultsContainer';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { TrainingType } from '@/types/training';

interface TrainingResultsDashboardProps {
  onReset: () => void;
}

const TrainingResultsDashboard: React.FC<TrainingResultsDashboardProps> = ({ onReset }) => {
  const { 
    activeExperimentId, 
    experimentStatus,
    error,
    resetTrainingState,
    lastTrainingType,
    experimentResults,
    setLastTrainingType
  } = useTraining();

  // ✅ IMPROVED: More robust training type detection logic with additional logging
  const getTrainingType = (): TrainingType => {
    // First check if results have explicit training_type
    if (experimentResults?.training_type === 'custom') {
      console.log("[TrainingResultsDashboard] Detected custom training from training_type");
      return 'custom';
    }
    
    // Then check if results have algorithm (custom training indicator)
    if (experimentResults?.algorithm) {
      console.log("[TrainingResultsDashboard] Detected custom training from algorithm field");
      return 'custom';
    }
    
    // Then check if results have automl_engine (automl indicator)
    if (experimentResults?.automl_engine) {
      console.log("[TrainingResultsDashboard] Detected automl from automl_engine field");
      return 'automl';
    }
    
    // If neither is available, use lastTrainingType from context
    console.log("[TrainingResultsDashboard] Using lastTrainingType from context:", lastTrainingType);
    return lastTrainingType === 'custom' ? 'custom' : 'automl';
  };

  // ✅ IMPROVED: Enhanced reset handler with better training type preservation
  const handleReset = () => {
    // Save current training type before reset
    const currentType = getTrainingType();
    console.log("[TrainingResultsDashboard] Resetting with training type:", currentType);
    
    // Explicitly update the lastTrainingType in context before reset
    if (currentType && currentType !== lastTrainingType) {
      console.log("[TrainingResultsDashboard] Updating lastTrainingType in context:", currentType);
      setLastTrainingType(currentType);
    }
    
    // Store the training type in localStorage for persistence
    if (currentType) {
      console.log("[TrainingResultsDashboard] Storing training type in localStorage:", currentType);
      localStorage.setItem('lastTrainingType', currentType);
    }
    
    // Call the provided onReset (for any parent component handlers)
    if (onReset) {
      onReset();
    }
    
    // Call the training context resetTrainingState
    // The resetTrainingState function has been modified to preserve the training type
    resetTrainingState();
  };

  if (error) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Training Error
          </CardTitle>
          <CardDescription>
            There was a problem with your training job
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive mb-4">
            {error}
          </div>
          <Button onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!activeExperimentId) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-primary" />
            No Active Experiment
          </CardTitle>
          <CardDescription>
            Start a training job to see results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleReset} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Start New Training
          </Button>
        </CardContent>
      </Card>
    );
  }

  const trainingType = getTrainingType();
  console.log("[TrainingResultsDashboard] Current training type:", trainingType);

  return (
    <div className="space-y-4">
      {/* Display training type badge */}
      <div className="flex justify-end">
        <Badge 
          variant={trainingType === 'custom' ? 'custom' : 'automl'}
          className="text-xs"
        >
          {trainingType === 'custom' ? 'Custom Training' : 'AutoML'}
        </Badge>
      </div>
      
      <ExperimentResultsContainer 
        experimentId={activeExperimentId}
        status={experimentStatus}
      />
      
      {experimentStatus === 'success' && (
        <div className="flex justify-end mt-4">
          <Button 
            asChild
            className="bg-white text-black border border-black hover:bg-black hover:text-white"
            size="lg"
          >
            <Link to="/dashboard">
              <PieChart className="h-4 w-4 mr-2" /> 
              Go to Dashboard
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default TrainingResultsDashboard;
