
import React from 'react';
import { useTraining } from '@/contexts/training/TrainingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Award, PieChart } from 'lucide-react';
import ExperimentResultsContainer from '@/components/experiments/ExperimentResultsContainer';
import { Link } from 'react-router-dom';

interface TrainingResultsDashboardProps {
  onReset: () => void;
}

const TrainingResultsDashboard: React.FC<TrainingResultsDashboardProps> = ({ onReset }) => {
  const { 
    activeExperimentId, 
    experimentStatus,
    error
  } = useTraining();

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
          <Button onClick={onReset}>
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
          <Button onClick={onReset} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Start New Training
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <ExperimentResultsContainer 
        experimentId={activeExperimentId}
        status={experimentStatus}
        onRefresh={onReset}
        onReset={onReset}
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
