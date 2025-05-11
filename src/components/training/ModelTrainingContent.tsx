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
    isPredicting,
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
      isPredicting,
      isLoadingResults, 
      resultsLoaded,
      lastTrainingType,
      showResultsAndPredict: showResultsAndPredict(),
      activeTab
    });
  }, [experimentStatus, isTraining, isPredicting, isLoadingResults, resultsLoaded, lastTrainingType, activeTab]);

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
  
  // IMPROVED: Check if tabs should be disabled based on active training or prediction
  const isTabDisabled = (tabName: string) => {
    // If currently predicting, disable all tabs except the predict tab
    if (isPredicting && tabName !== 'predict') {
      console.log(`ModelTrainingContent - Disabling ${tabName} tab because prediction is in progress`);
      return true;
    }
    
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
      
      // ENHANCED: Also prevent switching to results/predict during training until they're ready
      if ((tabName === 'results' || tabName === 'predict') && !showResultsAndPredict()) {
        console.log(`ModelTrainingContent - Disabling ${tabName} tab during training because results aren't available yet`);
        return true;
      }
    }
    
    // For Results and Predict tabs, use existing logic
    if ((tabName === 'results' || tabName === 'predict') && !showResultsAndPredict()) {
      return true;
    }
    
    return false;
  };

  // UPDATED: Modified tab switching logic to respect active training type
  useEffect(() => {
    const canShowResultsAndPredict = showResultsAndPredict();
    
    if ((activeTab === 'results' || activeTab === 'predict') && !canShowResultsAndPredict) {
      // Only switch to default training tab if results/predict tabs aren't available
      console.log("ModelTrainingContent - Results/predict not available, switching to appropriate training tab");
      
      // Choose tab based on last training type, defaulting to automl if unknown
      if (lastTrainingType === 'custom') {
        setActiveTab('custom');
      } else {
        setActiveTab('automl');
      }
    }
    // DO NOT auto-switch tabs during active training - respect the current tab
    // This allows the user to stay on the custom tab when running custom training
  }, [activeTab, showResultsAndPredict, setActiveTab, lastTrainingType]);

  // Reset processing status if we have valid dataset data and status is still 'processing'
  useEffect(() => {
    if (datasetId && taskType && experimentStatus === 'processing' && !activeExperimentId) {
      // Only reset to idle if we don't have an active experiment
      console.log("ModelTrainingContent - Resetting experimentStatus from 'processing' to 'idle'");
      setExperimentStatus('idle');
    }
  }, [datasetId, taskType, experimentStatus, activeExperimentId, setExperimentStatus]);

  // FIXED: Modified auto-switch to results tab to work for both AutoML and Custom training
  useEffect(() => {
    // Track switch attempts for debugging
    if (autoSwitchAttempts > 5) return; // Prevent infinite loop
    
    const isCompleted = experimentStatus === 'completed' || experimentStatus === 'success';
    const canShowResults = showResultsAndPredict();
    
    // Common conditions for switching to results tab for both AutoML and Custom training
    const shouldSwitch = 
      resultsLoaded && 
      activeExperimentId && 
      isCompleted &&
      canShowResults &&
      (activeTab === 'automl' || activeTab === 'custom');
    
    console.log("ModelTrainingContent - Tab switching check:", {
      resultsLoaded,
      isCompleted,
      activeTab,
      shouldSwitch,
      canShowResults,
      trainingType: lastTrainingType,
      autoSwitchAttempts
    });
    
    if (shouldSwitch) {
      console.log(`ModelTrainingContent - Auto-switching to results tab for ${lastTrainingType} training`);
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
    if (isPredicting) return "Generating prediction...";
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

  // FIXED: Modified reset handler to preserve the active tab when possible
  const handleReset = () => {
    console.log("Reset button clicked, stopping polling and resetting training state");
    stopPolling(); // First stop any active polling
    resetTrainingState(); // Then reset the training state
    
    // Choose appropriate tab based on current active tab
    if (activeTab === 'automl' || activeTab === 'custom') {
      // If already on a training tab, stay there
      console.log(`ModelTrainingContent - After reset, staying on ${activeTab} tab`);
    } else {
      // If on results or predict tab, go back to last training type or default to automl
      console.log(`ModelTrainingContent - After reset, switching to ${lastTrainingType || 'automl'} tab`);
      // Fix: Ensure we only use allowed tab values (not generic string)
      const newTab = lastTrainingType === 'custom' ? 'custom' : 'automl';
      setActiveTab(newTab);
    }
    
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
      {(isProcessing || (isLoadingResults && !resultsLoaded) || isPredicting) && (
        <Alert className="mb-4 bg-primary-foreground border-primary/30">
          <div className="flex flex-col w-full">
            <div className="flex items-center mb-2">
              <Loader className="h-4 w-4 animate-spin text-primary mr-2" />
              <span className="font-semibold">
                {isPredicting ? "Generating prediction..." : getStatusMessage()}
              </span>
              {lastTrainingType === 'automl' && activeTab !== 'custom' && !isPredicting && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">AutoML</span>
              )}
              {lastTrainingType === 'custom' && !isPredicting && (
                <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">Custom</span>
              )}
              {isPredicting && (
                <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Prediction</span>
              )}
            </div>
            <Progress 
              value={isTraining ? 70 : isPredicting ? 80 : isLoadingResults ? 90 : 50} 
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
      <Tabs 
        value={activeTab} 
        onValueChange={(tab) => {
          // Only allow tab switching if not training or if explicitly allowed
          if (!isTraining || 
              // Allow switching to results/predict if they're available
              ((tab === 'results' || tab === 'predict') && showResultsAndPredict()) ||
              // Allow switching between tabs that match the current training type
              (isTraining && lastTrainingType === 'automl' && tab === 'automl') ||
              (isTraining && lastTrainingType === 'custom' && tab === 'custom')
             ) {
            console.log(`ModelTrainingContent - Tab change allowed to: ${tab}`);
            setActiveTab(tab);
          } else {
            console.log(`ModelTrainingContent - Tab change to ${tab} prevented during training`);
          }
        }} 
        className="w-full"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-4'} bg-gray-100`}>
            <TabsTrigger 
              value="automl" 
              disabled={isTabDisabled('automl')}
              className={`data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm md:text-base ${isTabDisabled('automl') ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isTabDisabled('automl') && <CircleSlash className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
              AutoML
            </TabsTrigger>
            <TabsTrigger 
              value="custom" 
              disabled={isTabDisabled('custom')}
              className={`data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm md:text-base ${isTabDisabled('custom') ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isTabDisabled('custom') && <CircleSlash className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
              Custom
            </TabsTrigger>
            <TabsTrigger 
              value="results" 
              className={`data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm md:text-base ${isMobile ? 'mt-2' : ''} ${isTabDisabled('results') ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isTabDisabled('results')}
            >
              {isTabDisabled('results') && <CircleSlash className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
              Results
            </TabsTrigger>
            <TabsTrigger 
              value="predict" 
              className={`data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm md:text-base ${isMobile ? 'mt-2' : ''} ${isTabDisabled('predict') ? 'opacity-50 cursor-not-allowed' : ''}`}
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
