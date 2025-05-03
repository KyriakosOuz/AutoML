
import React from 'react';
import { useTraining } from '@/contexts/training/TrainingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, Award, PieChart, ChevronRight } from 'lucide-react';
import ExperimentResultsContainer from '@/components/experiments/ExperimentResultsContainer';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TrainingResultsDashboardProps {
  onReset: () => void;
}

const TrainingResultsDashboard: React.FC<TrainingResultsDashboardProps> = ({ onReset }) => {
  const { 
    activeExperimentId, 
    experimentStatus,
    error,
    selectedAlgorithm,
    targetColumn,
    taskType
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
      <div className="flex flex-wrap gap-3 mb-3">
        {taskType && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Task: {taskType}
          </Badge>
        )}
        {targetColumn && (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Target: {targetColumn}
          </Badge>
        )}
        {selectedAlgorithm && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Algorithm: {selectedAlgorithm}
          </Badge>
        )}
        {activeExperimentId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 cursor-help">
                Experiment ID: {activeExperimentId.substring(0, 8)}...
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{activeExperimentId}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      
      <ExperimentResultsContainer 
        experimentId={activeExperimentId}
        status={experimentStatus}
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
              Compare Results & Run Predictions
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default TrainingResultsDashboard;
