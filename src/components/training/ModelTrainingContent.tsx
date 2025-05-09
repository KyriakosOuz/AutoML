import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTraining } from '@/contexts/training/TrainingContext';
import { useDataset } from '@/contexts/DatasetContext';
import AutoMLTraining from './AutoMLTraining';
import CustomTraining from './CustomTraining';
import DatasetSummary from './DatasetSummary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CircleSlash, AlertCircle, Loader, Info, RotateCcw } from 'lucide-react';
import ExperimentResultsView from './ExperimentResultsView';
import DynamicPredictionForm from './DynamicPredictionForm';
import { useIsMobile } from '@/hooks/use-mobile';
import TrainingInsights from '@/components/ai-assistant/TrainingInsights';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import debugLog from '@/utils/debugLogger';

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
    stopPolling,
    resultsLoaded,
    lastTrainingType
  } = useTraining();
  
  const { datasetId, taskType, processingStage } = useDataset();
  const isMobile = useIsMobile();
  
  // Add a debug state to track tab switching attempts
  const [autoSwitchAttempts, setAutoSwitchAttempts] = useState(0);
  const [lastStatusLogged, setLastStatusLogged] = useState('');
  
  // Memoized value to determine if results and predict tabs should be shown
  const showResultsAndPredict = useMemo(() => {
    // Base conditions: Has valid experiment ID
    const hasValidExperiment = !!activeExperimentId;
    if (!hasValidExperiment) return false;
    
    // Show tabs when ANY of these conditions are true:
    // 1. Results are explicitly loaded (most reliable indicator)
    // 2. Experiment is completed according to status AND we're not actively training
    // 3. We have experiment results object cached
    // 4. For AutoML experiments, explicitly check lastTrainingType
    const isExperimentDone = experimentStatus === 'completed' || experimentStatus === 'success';
    const hasLoadedResults = resultsLoaded;
    const hasResultsObject = !!experimentResults;
    const isCurrentlyTraining = isTraining;
    const isAutoML = lastTrainingType === 'automl';
    
    // Add special logic for AutoML experiments
    const shouldShow = 
      hasValidExperiment && 
      (hasLoadedResults || 
       (isExperimentDone && !isCurrentlyTraining) ||
       hasResultsObject ||
       (isAutoML && isExperimentDone));
    
    // Only log when the value changes
    const stateSignature = `${hasValidExperiment}-${isExperimentDone}-${hasLoadedResults}-${hasResultsObject}-${isCurrentlyTraining}-${isAutoML}`;
    if (lastStatusLogged !== stateSignature) {
      setLastStatusLogged(stateSignature);
      debugLog("ModelTrainingContent", "showResultsAndPredict calculation", {
        experimentStatus,
        hasValidExperiment,
        notTraining: !isCurrentlyTraining,
        resultsLoaded: hasLoadedResults,
        hasExperimentResults: hasResultsObject,
        isAutoML,
        shouldShow
      });
    }
    
    return shouldShow;
  }, [activeExperimentId, experimentStatus, resultsLoaded, experimentResults, isTraining, lastTrainingType, lastStatusLogged]);

  // Add status indicator - Using the explicit resultsLoaded state
  const isProcessing = 
    (experimentStatus === 'processing' || experimentStatus === 'running' || isTraining) && 
    !resultsLoaded;

  // If current tab is results or predict but experiment is not completed, switch to automl
  useEffect(() => {
    if ((activeTab === 'results' || activeTab === 'predict') && !showResultsAndPredict) {
      debugLog("ModelTrainingContent", "Switching to automl tab because results/predict not available");
      setActiveTab('automl');
    }
  }, [activeTab, showResultsAndPredict, setActiveTab]);

  // Reset processing status if we have valid dataset data and status is still 'processing'
  useEffect(() => {
    if (datasetId && taskType && experimentStatus === 'processing' && !activeExperimentId) {
      // Only reset to idle if we don't have an active experiment
      debugLog("ModelTrainingContent", "Resetting experimentStatus from 'processing' to 'idle'");
      setExperimentStatus('idle');
    }
  }, [datasetId, taskType, experimentStatus, activeExperimentId, setExperimentStatus]);

  // Auto-switch to results tab when results are loaded - ENHANCED for AutoML with attempt limiting
  useEffect(() => {
    // Track switch attempts for debugging
    if (autoSwitchAttempts > 5) return; // Prevent infinite loop
    
    const isAutoML = lastTrainingType === 'automl';
    const isCompleted = experimentStatus === 'completed' || experimentStatus === 'success';
    const canShowResults = showResultsAndPredict;
    const shouldSwitch = 
      resultsLoaded && 
      activeExperimentId && 
      isCompleted &&
      canShowResults &&
      (activeTab === 'automl' || activeTab === 'custom');
    
    // Add special case for AutoML
    const shouldSwitchAutoML = 
      isAutoML && 
      isCompleted && 
      activeExperimentId && 
      (activeTab === 'automl');
    
    const switchNeeded = shouldSwitch || shouldSwitchAutoML;
    
    // Only log when actually attempting to switch
    if (switchNeeded) {
      debugLog("ModelTrainingContent", `Auto-switching to results tab (${isAutoML ? 'AutoML' : 'general'})`, {
        attemptCount: autoSwitchAttempts + 1
      });
      setActiveTab('results');
      // Increment attempt counter
      setAutoSwitchAttempts(prev => prev + 1);
    }
  }, [resultsLoaded, activeExperimentId, experimentStatus, activeTab, setActiveTab, lastTrainingType, autoSwitchAttempts, showResultsAndPredict]);

  // If experiment is completed, but we don't have results, try to fetch them - with added guard
  useEffect(() => {
    const shouldFetch = 
      activeExperimentId && 
      (experimentStatus === 'completed' || experimentStatus === 'success') && 
      !isLoadingResults && 
      !experimentResults && 
      !resultsLoaded;
      
    if (shouldFetch) { 
      debugLog("ModelTrainingContent", "Fetching experiment results for completed experiment");
      getExperimentResults();
    }
  }, [activeExperimentId, experimentStatus, isLoadingResults, getExperimentResults, experimentResults, resultsLoaded]);

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

  // Handle reset button click - memoized to prevent recreations
  const handleReset = useCallback(() => {
    debugLog("ModelTrainingContent", "Reset button clicked, stopping polling and resetting training state");
    stopPolling(); // First stop any active polling
    resetTrainingState(); // Then reset the training state
    setActiveTab('automl'); // Set the active tab to automl
    setAutoSwitchAttempts(0); // Reset the auto switch counter
  }, [stopPolling, resetTrainingState, setActiveTab]);

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
      
      {/* Display status bar when experiment is in progress or loading */}
      {(isProcessing || (isLoadingResults && !resultsLoaded)) && (
        <Alert className="mb-4 bg-primary-foreground border-primary/30">
          <div className="flex flex-col w-full">
            <div className="flex items-center mb-2">
              <Loader className="h-4 w-4 animate-spin text-primary mr-2" />
              <span className="font-semibold">
                {getStatusMessage()}
              </span>
              {lastTrainingType === 'automl' && activeTab !== 'custom' && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">AutoML</span>
              )}
              {lastTrainingType === 'custom' && (
                <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">Custom</span>
              )}
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

      {/* Add info message when viewing existing experiment results */}
      {activeExperimentId && experimentResults && resultsLoaded && !isProcessing && !isLoadingResults && (
        <Alert variant="info" className="mb-4">
          <Info className="h-4 w-4 text-blue-500 mr-2" />
          <AlertDescription className="text-sm">
            Viewing results for {lastTrainingType === 'automl' ? 
              <span className="font-medium">AutoML</span> : 
              <span className="font-medium">Custom</span>} experiment <strong>{experimentResults.experiment_name || activeExperimentId.substring(0, 8)}</strong>
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
