
import React, { useState, useEffect } from 'react';
import { useTraining } from '@/contexts/training/TrainingContext';
import { useDataset } from '@/contexts/DatasetContext';
import AutoMLTraining from './AutoMLTraining';
import CustomTraining from './CustomTraining';
import DatasetSummary from './DatasetSummary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CircleSlash, Play, AlertCircle, Loader, Info, RotateCcw } from 'lucide-react';
import ExperimentResultsView from './ExperimentResultsView';
import DynamicPredictionForm from './DynamicPredictionForm';
import { useIsMobile } from '@/hooks/use-mobile';
import TrainingInsights from '@/components/ai-assistant/TrainingInsights';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';

const ModelTrainingContent: React.FC = () => {
  const { 
    activeTab,
    setActiveTab,
    resetTrainingState,
    activeExperimentId,
    experimentStatus,
    setExperimentStatus,
    isTraining,
    setIsTraining,
    isLoadingResults,
    getExperimentResults,
    experimentResults,
    stopPolling
  } = useTraining();
  
  const { datasetId, taskType, processingStage } = useDataset();
  const isMobile = useIsMobile();
  
  // State to track when results are fully loaded
  const [resultsLoaded, setResultsLoaded] = useState(false);

  // Ensure isTraining is set to false when status is completed or success
  useEffect(() => {
    if ((experimentStatus === 'completed' || experimentStatus === 'success') && isTraining) {
      console.log("ModelTrainingContent - Setting isTraining to false because status is", experimentStatus);
      setIsTraining(false);
    }
  }, [experimentStatus, isTraining, setIsTraining]);

  // Show results and predict tabs only when experiment is completed
  const showResultsAndPredict = 
    (experimentStatus === 'completed' || experimentStatus === 'success') && 
    activeExperimentId && 
    !isTraining;

  // Add status indicator - Modified to also check resultsLoaded
  const isProcessing = 
    (experimentStatus === 'processing' || experimentStatus === 'running' || isTraining) && 
    !resultsLoaded;
  
  // More detailed status logging
  useEffect(() => {
    console.log("ModelTrainingContent - Current state:", { 
      datasetId,
      taskType,
      processingStage,
      activeTab,
      experimentStatus,
      isTraining,
      isLoadingResults,
      activeExperimentId,
      resultsLoaded,
      showResultsAndPredict
    });
  }, [datasetId, taskType, processingStage, activeTab, experimentStatus, isTraining, isLoadingResults, activeExperimentId, resultsLoaded, showResultsAndPredict]);

  // If current tab is results or predict but experiment is not completed, switch to automl
  useEffect(() => {
    if ((activeTab === 'results' || activeTab === 'predict') && !showResultsAndPredict) {
      console.log("ModelTrainingContent - Switching to automl tab because results/predict not available");
      setActiveTab('automl');
    }
  }, [activeTab, showResultsAndPredict, setActiveTab]);

  // Reset processing status if we have valid dataset data and status is still 'processing'
  useEffect(() => {
    if (datasetId && taskType && experimentStatus === 'processing' && !activeExperimentId) {
      // Only reset to idle if we don't have an active experiment
      console.log("ModelTrainingContent - Resetting experimentStatus from 'processing' to 'idle'");
      setExperimentStatus('idle');
    }
  }, [datasetId, taskType, experimentStatus, activeExperimentId, setExperimentStatus]);

  // Trigger experiment results fetch when appropriate
  useEffect(() => {
    if (activeExperimentId && (experimentStatus === 'completed' || experimentStatus === 'success') && !isLoadingResults && !experimentResults) {
      console.log("ModelTrainingContent - Fetching experiment results for completed experiment");
      getExperimentResults();
    }
  }, [activeExperimentId, experimentStatus, isLoadingResults, getExperimentResults, experimentResults]);

  // Update resultsLoaded state when experimentResults are available
  useEffect(() => {
    if (experimentResults && !isLoadingResults && 
        (experimentStatus === 'completed' || experimentStatus === 'success')) {
      console.log("ModelTrainingContent - Results are loaded, updating state");
      // Add small delay to ensure UI updates properly
      const timer = setTimeout(() => {
        setResultsLoaded(true);
        
        // Ensure tabs become available by setting isTraining to false if it's still true
        if (isTraining) {
          console.log("ModelTrainingContent - Forcing isTraining to false since results are loaded");
          setIsTraining(false);
        }
        
        // If we're on the automl or custom tab when results load, automatically switch to results tab
        if ((activeTab === 'automl' || activeTab === 'custom') && activeExperimentId) {
          console.log("ModelTrainingContent - Auto-switching to results tab");
          setActiveTab('results');
        }
      }, 100);
      
      return () => clearTimeout(timer);
    } else if (!experimentResults || isLoadingResults || 
               (experimentStatus !== 'completed' && experimentStatus !== 'success')) {
      setResultsLoaded(false);
    }
  }, [experimentResults, isLoadingResults, experimentStatus, isTraining, setIsTraining, activeTab, setActiveTab, activeExperimentId]);

  // Determine if dataset is ready for training
  const isDatasetReady = !!(
    datasetId && 
    taskType && 
    (processingStage === 'final' || processingStage === 'processed')
  );

  // Get appropriate status message
  const getStatusMessage = () => {
    if (isTraining) return 'Training in Progress...';
    if (isLoadingResults) return 'Loading Results...';
    if (experimentStatus === 'processing') return 'Processing...';
    if (experimentStatus === 'running') return 'Running...';
    return 'Working...';
  };

  // Format experiment creation time if available
  const getExperimentTimeInfo = () => {
    if (experimentResults?.created_at) {
      try {
        return formatDistanceToNow(new Date(experimentResults.created_at), { addSuffix: true });
      } catch (e) {
        return '';
      }
    }
    return '';
  };

  // Handle reset button click
  const handleReset = () => {
    console.log("Reset button clicked, stopping polling and resetting training state");
    stopPolling(); // First stop any active polling
    resetTrainingState(); // Then reset the training state
    setActiveTab('automl'); // Set the active tab to automl
  };

  return (
    <div className="space-y-6">
      <DatasetSummary />
      
      <div className="flex justify-between items-center">
        {/* Display reset button when there's an active experiment or during training */}
        {(activeExperimentId || isTraining || isProcessing) && (
          <Button 
            variant="outline" 
            className="mb-4" 
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Training
          </Button>
        )}
      </div>
      
      {/* Display status bar when experiment is in progress or loading - updated condition */}
      {(isProcessing || (isLoadingResults && !resultsLoaded)) && (
        <Alert className="mb-4 bg-primary-foreground border-primary/30">
          <div className="flex flex-col w-full">
            <div className="flex items-center mb-2">
              <Loader className="h-4 w-4 animate-spin text-primary mr-2" />
              <span className="font-semibold">
                {getStatusMessage()}
              </span>
            </div>
            <Progress 
              value={isTraining ? 70 : isLoadingResults ? 90 : 50} 
              className="h-2 w-full" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {activeExperimentId && `Experiment ID: ${activeExperimentId.substring(0, 8)}...`}
            </p>
          </div>
        </Alert>
      )}

      {/* Add info message when viewing existing experiment results - updated condition */}
      {activeExperimentId && experimentResults && resultsLoaded && !isProcessing && !isLoadingResults && (
        <Alert variant="info" className="mb-4">
          <Info className="h-4 w-4 text-blue-500 mr-2" />
          <AlertDescription className="text-sm">
            Viewing results for experiment <strong>{experimentResults.experiment_name || activeExperimentId.substring(0, 8)}</strong>
            {experimentResults.algorithm && ` using ${experimentResults.algorithm}`}
            {getExperimentTimeInfo() && ` (created ${getExperimentTimeInfo()})`}
          </AlertDescription>
        </Alert>
      )}
      
      {!isDatasetReady && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
          <AlertDescription>
            Please complete dataset setup and preprocessing before training a model.
            {processingStage && ` Current stage: ${processingStage}`}
          </AlertDescription>
        </Alert>
      )}
      <TrainingInsights />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-4'} bg-gray-100`}>
            <TabsTrigger 
              value="automl" 
              className="data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm md:text-base"
            >
              AutoML
            </TabsTrigger>
            <TabsTrigger 
              value="custom" 
              className="data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm md:text-base"
            >
              Custom
            </TabsTrigger>
            <TabsTrigger 
              value="results" 
              className={`data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm md:text-base ${isMobile ? 'mt-2' : ''}`}
              disabled={!showResultsAndPredict}
            >
              {!showResultsAndPredict && <CircleSlash className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
              Results
            </TabsTrigger>
            <TabsTrigger 
              value="predict" 
              className={`data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm md:text-base ${isMobile ? 'mt-2' : ''}`}
              disabled={!showResultsAndPredict}
            >
              {!showResultsAndPredict && <CircleSlash className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
              Predict
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="automl" className="space-y-4">
          <AutoMLTraining />
        </TabsContent>
        <TabsContent value="custom" className="space-y-4">
          <CustomTraining />
        </TabsContent>
        <TabsContent value="results" className="space-y-4">
          {showResultsAndPredict && activeExperimentId ? (
            <ExperimentResultsView experimentId={activeExperimentId} />
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-lg font-medium mb-2">No Results Available</h3>
              <p className="text-muted-foreground">
                Complete a training run to see model results
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="predict" className="space-y-4">
          {showResultsAndPredict && activeExperimentId ? (
            <DynamicPredictionForm experimentId={activeExperimentId} />
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Prediction Not Available</h3>
              <p className="text-muted-foreground">
                Complete a training run to make predictions
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModelTrainingContent;
