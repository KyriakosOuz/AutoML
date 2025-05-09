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
import { AlertCircle, Beaker, HelpCircle, Play, Settings, Loader } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateExperimentName } from '@/lib/constants';
import { ALLOWED_ALGORITHMS, DEFAULT_HYPERPARAMETERS } from '@/lib/constants';
import HyperParameterEditor from './HyperParameterEditor';
// The CustomTrainingResults import is still needed for TypeScript
import CustomTrainingResults from './CustomTrainingResults';
import { ExperimentResults } from '@/types/training';
import { useNavigate } from 'react-router-dom';

const CustomTraining: React.FC = () => {
  
  const { datasetId, taskType: datasetTaskType, targetColumn } = useDataset();
  const {
    isTraining,
    setIsTraining,
    isSubmitting, // Use global isSubmitting state
    setIsSubmitting, // Use global setIsSubmitting function
    customParameters,
    setCustomParameters,
    setLastTrainingType,
    setError,
    
    activeExperimentId,
    setActiveExperimentId,
    experimentResults,
    isLoadingResults,
    startPolling,
    stopPolling,
    activeTab
  } = useTraining();
  
  const { toast } = useToast();
  const [experimentName, setExperimentName] = useState('');
  const [algorithms, setAlgorithms] = useState<string[]>([]);
  const [isLoadingAlgorithms, setIsLoadingAlgorithms] = useState(false);
  const [hasFetchedParams, setHasFetchedParams] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    return () => {
    };
  }, []);

  useEffect(() => {
    if (datasetTaskType) {
      setIsLoadingAlgorithms(true);
      trainingApi.getAvailableAlgorithms(datasetTaskType)
        .then(algorithms => {
          setAlgorithms(algorithms);
          setIsLoadingAlgorithms(false);
        })
        .catch(error => {
          console.error('Error fetching algorithms:', error);
          setIsLoadingAlgorithms(false);
          setAlgorithms(ALLOWED_ALGORITHMS[datasetTaskType] || []);
        });
    }
  }, [datasetTaskType]);

  useEffect(() => {
    if (customParameters.algorithm) {
      const newName = generateExperimentName('Custom', customParameters.algorithm.toUpperCase());
      setExperimentName(newName);
    }
  }, [customParameters.algorithm]);

  // Reset hasFetchedParams when algorithm changes
  useEffect(() => {
    setHasFetchedParams(false);
  }, [customParameters.algorithm]);

  // Fixed hyperparameter fetching to prevent infinite loops
  useEffect(() => {
    if (
      customParameters.algorithm && 
      !customParameters.useDefaultHyperparameters && 
      !hasFetchedParams &&
      Object.keys(customParameters.hyperparameters || {}).length === 0
    ) {
      trainingApi.getAvailableHyperparameters(customParameters.algorithm)
        .then(params => {
          setCustomParameters({
            hyperparameters: params
          });
          setHasFetchedParams(true);
        })
        .catch(error => {
          console.error('Error fetching hyperparameters:', error);
          const defaultParams = DEFAULT_HYPERPARAMETERS[customParameters.algorithm] || {};
          setCustomParameters({
            hyperparameters: defaultParams
          });
          setHasFetchedParams(true);
        });
    }
  }, [customParameters.algorithm, customParameters.useDefaultHyperparameters, customParameters.hyperparameters, hasFetchedParams, setCustomParameters]);

  const toggleDefaultHyperparameters = () => {
    const newValue = !customParameters.useDefaultHyperparameters;
    setCustomParameters({ 
      useDefaultHyperparameters: newValue 
    });
    
    if (newValue && customParameters.algorithm) {
      const defaultParams = DEFAULT_HYPERPARAMETERS[customParameters.algorithm] || {};
      setCustomParameters({
        hyperparameters: defaultParams
      });
    }
  };

  // Fixed hyperparameter fetching to prevent infinite loops
  useEffect(() => {
    if (
      customParameters.algorithm && 
      !customParameters.useDefaultHyperparameters && 
      !hasFetchedParams &&
      Object.keys(customParameters.hyperparameters || {}).length === 0
    ) {
      trainingApi.getAvailableHyperparameters(customParameters.algorithm)
        .then(params => {
          setCustomParameters({
            hyperparameters: params
          });
          setHasFetchedParams(true);
        })
        .catch(error => {
          console.error('Error fetching hyperparameters:', error);
          const defaultParams = DEFAULT_HYPERPARAMETERS[customParameters.algorithm] || {};
          setCustomParameters({
            hyperparameters: defaultParams
          });
          setHasFetchedParams(true);
        });
    }
  }, [customParameters.algorithm, customParameters.useDefaultHyperparameters, customParameters.hyperparameters, hasFetchedParams, setCustomParameters]);

  const handleTrainModel = async () => {
    try {
      setActiveExperimentId(null);
      setIsTraining(true);
      setIsSubmitting(true); // Set isSubmitting to true when starting training
      setError(null);
      
      // Explicitly set the training type to 'custom'
      setLastTrainingType('custom');

      const formData = new FormData();
      formData.append('dataset_id', datasetId);
      formData.append('task_type', datasetTaskType);
      formData.append('algorithm', customParameters.algorithm);
      formData.append('use_default_hyperparams', String(customParameters.useDefaultHyperparameters));
      
      // CRITICAL FIX: Always send hyperparameters, whether using defaults or custom
      const hyperparamsToSend = customParameters.useDefaultHyperparameters 
        ? DEFAULT_HYPERPARAMETERS[customParameters.algorithm] || {}
        : customParameters.hyperparameters;
      
      formData.append('hyperparameters', JSON.stringify(hyperparamsToSend));
      
      formData.append('test_size', String(customParameters.testSize));
      formData.append('stratify', String(customParameters.stratify));
      formData.append('random_seed', String(customParameters.randomSeed));
      formData.append('experiment_name', experimentName || '');
      formData.append('enable_visualization', String(customParameters.enableVisualization));
      formData.append('store_model', 'true');

      toast({
        title: "Training Started",
        description: `Starting custom training with ${customParameters.algorithm}...`,
      });

      // Stop any existing polling before starting a new experiment
      if (stopPolling) stopPolling();

      const result = await trainingApi.customTrain(formData);
      
      if (result && result.experiment_id) {
        setActiveExperimentId(result.experiment_id);
        
        // Log the training type explicitly before starting polling
        console.log('[CustomTraining] Starting polling for CUSTOM experiment:', result.experiment_id);
        
        // FIX: Remove the second parameter 'custom' since startPolling only accepts one parameter in this context
        startPolling(result.experiment_id);
        
        toast({
          title: "Training Submitted",
          description: `Experiment ${result.experiment_name || result.experiment_id} started.`,
        });
      } else {
        throw new Error('No experiment ID returned from the server');
      }
    } catch (error) {
      console.error('Custom training error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to train model';
      setError(errorMessage);
      toast({
        title: "Training Failed",
        description: errorMessage,
        variant: "destructive"
      });
      setIsTraining(false);
    } finally {
      setIsSubmitting(false);
      setIsTraining(false); // Also reset isTraining flag to ensure UI is properly updated
    }
  };

  const resetExperiment = () => {
    setActiveExperimentId(null);
  };

  const isFormValid = () => {
    return !!(
      datasetId &&
      datasetTaskType &&
      customParameters.algorithm &&
      customParameters.testSize >= 0.1 &&
      customParameters.testSize <= 0.5
    );
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-primary">
            <Beaker className="h-5 w-5" />
            Custom Training
          </CardTitle>
          <CardDescription>
            Train models with custom algorithms and hyperparameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Algorithm</Label>
              <Select
                value={customParameters.algorithm}
                onValueChange={(value) => setCustomParameters({ algorithm: value })}
                disabled={isTraining || isLoadingAlgorithms}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingAlgorithms ? "Loading algorithms..." : "Select algorithm"} />
                </SelectTrigger>
                <SelectContent>
                  {algorithms.map((algo) => (
                    <SelectItem key={algo} value={algo}>
                      {algo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {customParameters.algorithm && (
              <div className="space-y-4">
                <HyperParameterEditor
                  algorithm={customParameters.algorithm}
                  hyperparameters={customParameters.hyperparameters}
                  onChange={(params) => setCustomParameters({ hyperparameters: params })}
                  useDefault={customParameters.useDefaultHyperparameters}
                  onToggleDefault={toggleDefaultHyperparameters}
                  defaultHyperparameters={DEFAULT_HYPERPARAMETERS[customParameters.algorithm]}
                />
              </div>
            )}

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
                disabled={isTraining}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Test Set Split</Label>
                <span className="text-sm font-medium">{(customParameters.testSize * 100).toFixed(0)}%</span>
              </div>
              <Slider
                id="test-size"
                min={0.1}
                max={0.5}
                step={0.05}
                value={[customParameters.testSize]}
                onValueChange={(values) => setCustomParameters({ testSize: values[0] })}
                disabled={isTraining}
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
                checked={customParameters.stratify}
                onCheckedChange={(checked) => setCustomParameters({ stratify: checked })}
                disabled={isTraining}
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
                value={customParameters.randomSeed}
                onChange={(e) => setCustomParameters({ randomSeed: parseInt(e.target.value) || 0 })}
                disabled={isTraining}
                placeholder="Enter random seed (e.g. 42)"
                aria-label="Random seed for reproducibility"
              />
              <p className="text-xs text-muted-foreground">For reproducible results</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="enable-visualization" className="flex items-center gap-2">
                  Enable Visualizations
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Generate visualizations like confusion matrix, ROC curves, etc.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <p className="text-xs text-muted-foreground">Generate visual insights for model performance</p>
              </div>
              <Switch
                id="enable-visualization"
                checked={customParameters.enableVisualization}
                onCheckedChange={(checked) => setCustomParameters({ enableVisualization: checked })}
                disabled={isTraining}
                aria-label="Enable visualizations"
              />
            </div>

            <Button
              onClick={handleTrainModel}
              disabled={isTraining || isSubmitting || !isFormValid()}
              className="w-full mt-4"
              size="lg"
            >
              {isTraining || isSubmitting ? (
                <>
                  <Loader className="mr-2 h-5 w-5 animate-spin" />
                  Training in Progress...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Train Model with {customParameters.algorithm}
                </>
              )}
            </Button>

            <div className="text-sm text-muted-foreground bg-primary-foreground p-3 rounded-md">
              <p className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Training might take several minutes depending on dataset size and complexity.</span>
              </p>
            </div>
            
            {activeExperimentId && (
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
                <p className="font-mono">Experiment ID: {activeExperimentId}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Commented out the results section to avoid duplication with the Results tab */}
    </div>
  );
};

export default CustomTraining;
