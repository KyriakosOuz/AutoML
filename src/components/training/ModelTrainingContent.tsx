
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
    stopPolling,
    resultsLoaded,
    lastTrainingType
  } = useTraining();
  
  const { datasetId, taskType, processingStage } = useDataset();
  const isMobile = useIsMobile();
  
  // Add a debug state to track tab switching attempts
  const [autoSwitchAttempts, setAutoSwitchAttempts] = useState(0);
  
  // Detailed logging for relevant state changes
  useEffect(() => {
    console.log("ModelTrainingContent - State update:", { 
      experimentStatus, 
      isTraining, 
      isLoadingResults, 
      resultsLoaded,
      lastTrainingType,
      showResultsAndPredict: showResultsAndPredict(),
      activeTab
    });
  }, [experimentStatus, isTraining, isLoadingResults, resultsLoaded, lastTrainingType, activeTab]);

  // Ensure isTraining is set to false when status is completed or success
  useEffect(() => {
    if ((experimentStatus === 'completed' || experimentStatus === 'success') && isTraining) {
      console.log("ModelTrainingContent - Setting isTraining to false because status is", experimentStatus);
      setIsTraining(false);
    }
  }, [experimentStatus, isTraining, setIsTraining]);

  // IMPROVED: More robust function to determine if results and predict tabs should be shown
  const showResultsAndPredict = () => {
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
       (isAutoML && isExperimentDone)); // Special case for AutoML experiments
    
    console.log("ModelTrainingContent - showResultsAndPredict check:", {
      experimentStatus,
      hasValidExperiment,
      notTraining: !isCurrentlyTraining,
      resultsLoaded: hasLoadedResults,
      hasExperimentResults: hasResultsObject,
      isAutoML,
      shouldShow
    });
    
    return shouldShow;
  };

  // Add status indicator - Using the explicit resultsLoaded state
  const isProcessing = 
    (experimentStatus === 'processing' || experimentStatus === 'running' || isTraining) && 
    !resultsLoaded;
  
  // IMPROVED: Check if tabs should be disabled based on active training
  const isTabDisabled = (tabName: string) => {
    // Both AutoML and Custom tabs are mutually exclusive during training
    if (isTraining) {
      // If currently running AutoML training, disable Custom tab
      if (lastTrainingType === 'automl' && tabName === 'custom') {
        console.log("ModelTrainingContent - Disabling Custom tab because AutoML is training");
        return true;
      }
      
      // If currently running Custom training, disable AutoML tab
      if (lastTrainingType === 'custom' && tabName === 'automl') {
        console.log("ModelTrainingContent - Disabling AutoML tab because Custom is training");
        return true;
      }
    }
    
    // For Results and Predict tabs, use existing logic
    if ((tabName === 'results' || tabName === 'predict') && !showResultsAndPredict()) {
      return true;
    }
    
    return false;
  };

  // If current tab is results or predict but experiment is not completed, switch to automl
  useEffect(() => {
    const canShowResultsAndPredict = showResultsAndPredict();
    if ((activeTab === 'results' || activeTab === 'predict') && !canShowResultsAndPredict) {
      console.log("ModelTrainingContent - Switching to automl tab because results/predict not available");
      setActiveTab('automl');
    }
    
    // NEW: If we're on a disabled tab, switch to appropriate tab
    if (isTraining && lastTrainingType) {
      if (activeTab === 'automl' && lastTrainingType === 'custom') {
        console.log("ModelTrainingContent - Switching to custom tab because Custom training is active");
        setActiveTab('custom');
      } else if (activeTab === 'custom' && lastTrainingType === 'automl') {
        console.log("ModelTrainingContent - Switching to automl tab because AutoML training is active");
        setActiveTab('automl');
      }
    }
  }, [activeTab, showResultsAndPredict, setActiveTab, isTraining, lastTrainingType]);

  // Reset processing status if we have valid dataset data and status is still 'processing'
  useEffect(() => {
    if (datasetId && taskType && experimentStatus === 'processing' && !activeExperimentId) {
      // Only reset to idle if we don't have an active experiment
      console.log("ModelTrainingContent - Resetting experimentStatus from 'processing' to 'idle'");
      setExperimentStatus('idle');
    }
  }, [datasetId, taskType, experimentStatus, activeExperimentId, setExperimentStatus]);

  // Auto-switch to results tab when results are loaded - ENHANCED for AutoML
  useEffect(() => {
    // Track switch attempts for debugging
    if (autoSwitchAttempts > 5) return; // Prevent infinite loop
    
    const isAutoML = lastTrainingType === 'automl';
    const isCompleted = experimentStatus === 'completed' || experimentStatus === 'success';
    const canShowResults = showResultsAndPredict();
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
    
    console.log("ModelTrainingContent - Tab switching check:", {
      resultsLoaded,
      isAutoML,
      isCompleted,
      activeTab,
      shouldSwitch,
      shouldSwitchAutoML,
      canShowResults,
      autoSwitchAttempts
    });
    
    if (shouldSwitch || shouldSwitchAutoML) {
      console.log(`ModelTrainingContent - Auto-switching to results tab (${isAutoML ? 'AutoML' : 'general'})`);
      setActiveTab('results');
      // Increment attempt counter
      setAutoSwitchAttempts(prev => prev + 1);
    }
  }, [resultsLoaded, activeExperimentId, experimentStatus, activeTab, setActiveTab, lastTrainingType, autoSwitchAttempts, showResultsAndPredict]);

  // If experiment is completed, but we don't have results, try to fetch them
  useEffect(() => {
    if (activeExperimentId && 
        (experimentStatus === 'completed' || experimentStatus === 'success') && 
        !isLoadingResults && 
        !experimentResults && 
        !resultsLoaded) { 
      console.log("ModelTrainingContent - Fetching experiment results for completed experiment");
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

  // Handle reset button click
  const handleReset = () => {
    console.log("Reset button clicked, stopping polling and resetting training state");
    stopPolling(); // First stop any active polling
    resetTrainingState(); // Then reset the training state
    setActiveTab('automl'); // Set the active tab to automl
    setAutoSwitchAttempts(0); // Reset the auto switch counter
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

      {/* Add info message when viewing existing experiment results - updated condition */}
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
              disabled={isTabDisabled('automl')}
              className="data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm md:text-base"
            >
              {isTabDisabled('automl') && <CircleSlash className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
              AutoML
            </TabsTrigger>
            <TabsTrigger 
              value="custom" 
              disabled={isTabDisabled('custom')}
              className="data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm md:text-base"
            >
              {isTabDisabled('custom') && <CircleSlash className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
              Custom
            </TabsTrigger>
            <TabsTrigger 
              value="results" 
              className={`data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm md:text-base ${isMobile ? 'mt-2' : ''}`}
              disabled={isTabDisabled('results')}
            >
              {isTabDisabled('results') && <CircleSlash className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
              Results
            </TabsTrigger>
            <TabsTrigger 
              value="predict" 
              className={`data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm md:text-base ${isMobile ? 'mt-2' : ''}`}
              disabled={isTabDisabled('predict')}
            >
              {isTabDisabled('predict') && <CircleSlash className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
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
          {showResultsAndPredict() && activeExperimentId ? (
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
          {showResultsAndPredict() && activeExperimentId ? (
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
