
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
    experimentResults
  } = useTraining();

  // ✅ NEW: Determine the most accurate training type to display
  const getTrainingType = (): TrainingType => {
    if (experimentResults?.training_type) {
      // ✅ FIXED: Ensure we return a valid TrainingType
      return experimentResults.training_type === 'custom' ? 'custom' : 'automl';
    }
    if (experimentResults?.algorithm) return 'custom';
    // ✅ FIXED: Ensure we validate lastTrainingType
    return lastTrainingType === 'custom' ? 'custom' : 'automl';
  };

  // A proper reset handler that uses the training context
  const handleReset = () => {
    // Save current training type before reset
    const currentType = getTrainingType();
    
    // Call the provided onReset (for any parent component handlers)
    if (onReset) {
      onReset();
    }
    
    // Also call the training context resetTrainingState
    resetTrainingState();
    
    // Store the training type in localStorage for persistence
    localStorage.setItem('lastTrainingType', currentType);
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

  return (
    <div className="space-y-4">
      {/* ✅ NEW: Display training type badge */}
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
        // No need to explicitly pass onReset as ExperimentResultsContainer 
        // now uses the training context directly
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
