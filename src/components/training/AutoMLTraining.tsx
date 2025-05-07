import React, { useState, useEffect } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { useTraining } from '@/contexts/training/TrainingContext';
import { trainingApi } from '@/lib/api';
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
    experimentStatus
  } = useTraining();
  const { user } = useAuth();
  const { toast } = useToast();
  const [experimentName, setExperimentName] = useState('');
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

  useEffect(() => {
    if (taskType && automlEngine) {
      const newName = generateExperimentName('AutoML', automlEngine.toUpperCase());
      setExperimentName(newName);
    }
  }, [taskType, automlEngine]);

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

    try {
      setIsSubmitting(true);
      setIsTraining(true);
      setError(null);
      setActiveExperimentId(null);

      toast({
        title: "Training Started",
        description: `Starting AutoML training with ${automlEngine}...`,
      });

      // Fix: Add experimentName parameter to the automlTrain function call
      // Check the API interface to ensure we're passing the correct parameters
      const result = await trainingApi.automlTrain({
        datasetId,
        taskType,
        engine: automlEngine,
        testSize,
        stratify,
        randomSeed,
        experimentName // Pass experiment name to the API
      });

      if (result && result.experiment_id) {
        setLastTrainingType('automl');
        startPolling(result.experiment_id);
        
        toast({
          title: "Training Submitted",
          description: `Experiment ${result.experiment_name || experimentName || result.experiment_id} started and now processing...`,
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
      processingStage
    });
    
    // Check if we have the required data and if dataset is properly processed
    // UPDATED: Accept both 'processed' and 'final' as valid processing stages
    const isValidProcessingStage = processingStage === 'final' || processingStage === 'processed';
    
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
                value={experimentName}
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
