import React, { useState, useEffect } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { useTraining } from '@/contexts/training/TrainingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Rocket, HelpCircle, Play, Settings, Loader, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateExperimentName } from '@/lib/constants';
import { TrainingEngine } from '@/types/training';
import { useAuth } from '@/contexts/AuthContext';
import * as trainingLib from '@/lib/training';  // Import from training.ts explicitly

const AutoMLTraining: React.FC = () => {
  const { datasetId, taskType, processingStage } = useDataset();
  const {
    isTraining,
    setIsTraining,
    automlEngine,
    setAutomlEngine,
    testSize,
    setTestSize,
    stratify,
    setStratify,
    randomSeed,
    setRandomSeed,
    setError,
    startPolling,
    setLastTrainingType,
    setActiveExperimentId,
    experimentStatus,
    experimentName,
    setExperimentName,
    setResultsLoaded
  } = useTraining();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    // Enhanced logging to help debugging
    console.log("AutoML Training - Dataset context values:", { 
      datasetId, 
      taskType, 
      processingStage,
      experimentStatus
    });
  }, [datasetId, taskType, processingStage, experimentStatus]);

  // UPDATED: Generate experiment name whenever automlEngine changes
  useEffect(() => {
    if (taskType && automlEngine) {
      // Generate a new name when engine changes, regardless of current name
      const newName = generateExperimentName(automlEngine.toUpperCase(), '');
      console.log("AutoMLTraining - Generated experiment name based on engine:", newName);
      setExperimentName(newName);
    }
  }, [taskType, automlEngine, setExperimentName]);

  const handleTrainModel = async () => {
    if (!datasetId || !taskType || !automlEngine) {
      toast({
        title: "Missing Required Fields",
        description: "Dataset ID, task type, and AutoML engine are required",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to start training",
        variant: "destructive"
      });
      return;
    }

    if (isTraining || isSubmitting) {
      toast({
        title: "Training Already in Progress",
        description: "Please wait for the current training to complete",
      });
      return;
    }

    // Check if experimentName is empty or just whitespace
    let finalExperimentName = experimentName;
    if (!experimentName || experimentName.trim() === '') {
      // Generate a default experiment name as fallback
      finalExperimentName = generateExperimentName(automlEngine.toUpperCase(), '');
      console.log("[AutoMLTraining] Using generated fallback name:", finalExperimentName);
      
      // Update the experiment name in the context
      setExperimentName(finalExperimentName);
      
      // Inform user we're using a default name
      toast({
        title: "Using Default Name",
        description: `No name provided, using '${finalExperimentName}'`,
      });
    }

    try {
      setIsSubmitting(true);
      setIsTraining(true);
      setError(null);
      // Reset the results loaded state at the beginning of training
      setResultsLoaded(false);
      setActiveExperimentId(null);

      toast({
        title: "Training Started",
        description: `Starting AutoML training with ${automlEngine}...`,
      });

      console.log("AutoMLTraining - Starting training with experiment name:", finalExperimentName);

      // ENHANCED: Add more debugging info before making the API call
      console.log("AutoMLTraining - Training parameters:", {
        datasetId,
        taskType,
        automlEngine,
        testSize,
        stratify,
        randomSeed,
        experimentName: finalExperimentName
      });

      // Use the function from training.ts instead of api.ts
      const result = await trainingLib.automlTrain(
        datasetId,
        taskType,
        automlEngine,
        testSize,
        stratify,
        randomSeed,
        finalExperimentName // Pass the final experiment name (either user-defined or generated)
      );

      if (result && result.experiment_id) {
        // Enhanced logging for AutoML experiment tracking
        console.log("[AutoMLTraining] AutoML training submitted successfully:", {
          experimentId: result.experiment_id,
          experimentName: finalExperimentName,
          engine: automlEngine,
          setLastTrainingType: 'automl' 
        });

        // IMPROVED: First set the training type to 'automl' explicitly
        setLastTrainingType('automl');
        
        // CRITICAL: Then set the active experiment ID
        setActiveExperimentId(result.experiment_id);
        
        // ENHANCED: Start polling with additional debugging
        console.log("[AutoMLTraining] Starting polling for experiment:", result.experiment_id);
        startPolling(result.experiment_id);
        
        // Log the experiment ID and name for debugging
        console.log("AutoMLTraining - Training submitted:", {
          experimentId: result.experiment_id,
          experimentName: finalExperimentName,
          resultName: result.experiment_name
        });
        
        toast({
          title: "Training Submitted",
          description: `Experiment ${finalExperimentName} started and now processing...`,
        });
      } else {
        throw new Error('No experiment ID returned from the server');
      }
    } catch (error) {
      console.error('AutoML training error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to train model';
      setError(errorMessage);
      setIsTraining(false);
      
      toast({
        title: "Training Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    // Enhanced logging for form validation
    console.log("AutoML - Checking if form is valid:", {
      datasetId,
      taskType,
      automlEngine,
      testSize,
      processingStage,
      experimentName
    });
    
    // Check if we have the required data and if dataset is properly processed
    // UPDATED: Accept both 'processed' and 'final' as valid processing stages
    const isValidProcessingStage = processingStage === 'final' || processingStage === 'processed';
    
    // MODIFIED: Removed the experimentName check since we'll generate a default one if needed
    const result = !!(
      datasetId &&
      taskType &&
      automlEngine &&
      testSize >= 0.1 &&
      testSize <= 0.5 &&
      isValidProcessingStage
    );
    
    console.log("AutoML - Form validation result:", { 
      result, 
      isValidProcessingStage
    });
    
    return result;
  };

  // More explicit conditions for button disabled state
  const isButtonDisabled = () => {
    const formNotValid = !isFormValid();
    const isProcessing = experimentStatus === 'processing' || experimentStatus === 'running';
    const isSubmittingNow = isTraining || isSubmitting;
    
    console.log("AutoML - Button disabled conditions:", {
      formNotValid,
      isProcessing,
      isSubmittingNow,
      experimentStatus
    });
    
    return formNotValid || isProcessing || isSubmittingNow;
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-primary">
            <Rocket className="h-5 w-5" />
            AutoML Training
          </CardTitle>
          <CardDescription>
            Automatically train models with different algorithms and hyperparameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {!datasetId && (
              <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                <AlertDescription>
                  Please select or process a dataset before training a model.
                </AlertDescription>
              </Alert>
            )}
            
            {datasetId && (!processingStage || !(processingStage === 'final' || processingStage === 'processed')) && (
              <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                <AlertDescription>
                  Please complete dataset preprocessing before training. Current stage: {processingStage || 'unknown'}
                </AlertDescription>
              </Alert>
            )}
            
            {isTraining && (
              <Alert className="mb-4 bg-primary/10 border-primary/20">
                <Loader className="h-4 w-4 animate-spin text-primary mr-2" />
                <AlertDescription>
                  Training is in progress. Please wait while your model is being trained.
                </AlertDescription>
              </Alert>
            )}

            {/* New persistent information alert about background processing */}
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600 mr-2" />
              <AlertDescription>
                <span className="font-semibold">Training continues in the background:</span> You can close this browser tab or window, and your training will continue on our servers. Return anytime to check progress.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label>AutoML Engine</Label>
              <Select
                value={automlEngine}
                onValueChange={(value) => setAutomlEngine(value as TrainingEngine)}
                disabled={isTraining || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AutoML engine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mljar">MLJAR</SelectItem>
                  <SelectItem value="h2o">H2O</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experiment-name" className="flex items-center gap-2">
                Experiment Name
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Name to identify this training experiment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="experiment-name"
                value={experimentName || ''}
                onChange={(e) => setExperimentName(e.target.value)}
                placeholder="Enter experiment name"
                disabled={isTraining || isSubmitting}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Test Set Split</Label>
                <span className="text-sm font-medium">{(testSize * 100).toFixed(0)}%</span>
              </div>
              <Slider
                id="test-size"
                min={0.1}
                max={0.5}
                step={0.05}
                value={[testSize]}
                onValueChange={(values) => setTestSize(values[0])}
                disabled={isTraining || isSubmitting}
                aria-label="Test set size"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="stratify" className="flex items-center gap-2">
                  Stratify Split
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Maintains class distribution in train/test sets. Recommended for classification tasks.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <p className="text-xs text-muted-foreground">Essential for balanced datasets in classification tasks</p>
              </div>
              <Switch
                id="stratify"
                checked={stratify}
                onCheckedChange={(checked) => setStratify(checked)}
                disabled={isTraining || isSubmitting}
                aria-label="Stratify split"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="random-seed" className="flex items-center gap-2">
                Random Seed
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Set for reproducible results. Using the same seed ensures consistent train/test splits.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="random-seed"
                type="number"
                min={0}
                value={randomSeed}
                onChange={(e) => setRandomSeed(parseInt(e.target.value) || 0)}
                disabled={isTraining || isSubmitting}
                placeholder="Enter random seed (e.g. 42)"
                aria-label="Random seed for reproducibility"
              />
              <p className="text-xs text-muted-foreground">For reproducible results</p>
            </div>

            {/* Comment out the Advanced Analytics section */}
            {/*
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="enable-analytics" className="flex items-center gap-2">
                  Enable Advanced Analytics
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enable advanced analytics and tracking during training</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <p className="text-xs text-muted-foreground">Enable or disable advanced analytics</p>
              </div>
              <Switch
                id="enable-analytics"
                checked={enableAnalytics}
                onCheckedChange={(checked) => setEnableAnalytics(checked)}
                disabled={isTraining || isSubmitting}
                aria-label="Enable advanced analytics"
              />
            </div>
            */}

            <Button
              onClick={handleTrainModel}
              disabled={isButtonDisabled()}
              className="w-full mt-4"
              size="lg"
            >
              {isTraining || isSubmitting ? (
                <>
                  <Loader className="mr-2 h-5 w-5 animate-spin" />
                  {experimentStatus === 'processing' 
                    ? 'Processing...' 
                    : experimentStatus === 'running' 
                      ? 'Training in Progress...' 
                      : 'Starting Training...'}
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Train Model with {automlEngine}
                </>
              )}
            </Button>

            <div className="text-sm text-muted-foreground bg-primary-foreground p-3 rounded-md mt-4">
              <p className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Training might take several minutes depending on dataset size and complexity.</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoMLTraining;
