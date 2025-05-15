import React, { useState, useEffect } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { useTraining } from '@/contexts/training/TrainingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Rocket, HelpCircle, Play, Settings, Loader, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ALLOWED_ALGORITHMS, DEFAULT_HYPERPARAMETERS, generateExperimentName } from '@/lib/constants';
import { TrainingEngine } from '@/types/training';
import { useAuth } from '@/contexts/AuthContext';
import * as trainingLib from '@/lib/training';
import { Checkbox } from '@/components/ui/checkbox';
import { SubmittedTrainingParameters } from '@/contexts/training/types';

interface Hyperparameter {
  type: 'number' | 'boolean' | 'string';
  value: number | boolean | string;
  options?: (number | string | boolean)[];
  range?: [number, number];
  step?: number;
}

interface AlgorithmHyperparameters {
  [key: string]: Hyperparameter;
}

const CustomTraining: React.FC = () => {
  const { datasetId, taskType, processingStage } = useDataset();
  const {
    isTraining,
    setIsTraining,
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
    setResultsLoaded,
    submittedParameters,
    setSubmittedParameters
  } = useTraining();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [algorithm, setAlgorithm] = useState('');
  const [useDefaultHyperparameters, setUseDefaultHyperparameters] = useState(true);
  const [selectedHyperparameters, setSelectedHyperparameters] = useState<AlgorithmHyperparameters | null>(null);
  const [userEditedName, setUserEditedName] = useState(false);

  useEffect(() => {
    setUserEditedName(false);
  }, []);

  useEffect(() => {
    if (taskType && algorithm) {
      if (!experimentName || experimentName.trim() === '') {
        const newName = generateExperimentName(algorithm.toUpperCase(), '');
        setExperimentName(newName);
      } else if (!userEditedName) {
        const newName = generateExperimentName(algorithm.toUpperCase(), '');
        setExperimentName(newName);
      }
    }
  }, [taskType, algorithm, setExperimentName, experimentName, userEditedName]);

  useEffect(() => {
    if (!isTraining && experimentStatus !== 'processing' && experimentStatus !== 'running') {
      setUserEditedName(false);
    }

    return () => {
      setUserEditedName(false);
    };
  }, [isTraining, experimentStatus]);

  const handleAlgorithmChange = (value: string) => {
    setAlgorithm(value);
    if (!experimentName || experimentName.trim() === '') {
      setUserEditedName(false);
    }
  };

  const handleExperimentNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserEditedName(true);
    setExperimentName(e.target.value);
  };

  const handleUseDefaultHyperparametersChange = (checked: boolean) => {
    setUseDefaultHyperparameters(checked);
    setSelectedHyperparameters(null);
  };

  useEffect(() => {
    if (algorithm && useDefaultHyperparameters) {
      const defaultParams = DEFAULT_HYPERPARAMETERS[algorithm];
      if (defaultParams) {
        const mappedHyperparameters: AlgorithmHyperparameters = {};
        for (const key in defaultParams) {
          const value = defaultParams[key];
          let type: 'number' | 'boolean' | 'string' = 'string';

          if (typeof value === 'number') {
            type = 'number';
          } else if (typeof value === 'boolean') {
            type = 'boolean';
          }

          mappedHyperparameters[key] = {
            type: type,
            value: value as number | boolean | string,
          };
        }
        setSelectedHyperparameters(mappedHyperparameters);
      } else {
        setSelectedHyperparameters(null);
      }
    }
  }, [algorithm, useDefaultHyperparameters]);

  const handleHyperparameterChange = (
    name: string,
    value: number | boolean | string
  ) => {
    setSelectedHyperparameters((prevHyperparameters) => {
      if (!prevHyperparameters) {
        return {
          [name]: {
            type: typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string',
            value: value,
          },
        };
      }

      return {
        ...prevHyperparameters,
        [name]: {
          ...prevHyperparameters[name],
          value: value,
        },
      };
    });
  };

  const handleTrainModel = async () => {
    if (!datasetId || !taskType || !algorithm) {
      toast({
        title: "Missing Required Fields",
        description: "Dataset ID, task type, and algorithm are required",
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

    let finalExperimentName = experimentName;
    if (!experimentName || experimentName.trim() === '') {
      finalExperimentName = generateExperimentName(algorithm.toUpperCase(), '');
      setExperimentName(finalExperimentName);

      toast({
        title: "Using Default Name",
        description: `No name provided, using '${finalExperimentName}'`,
      });
    }

    try {
      setIsSubmitting(true);
      setIsTraining(true);
      setError(null);
      setResultsLoaded(false);
      setActiveExperimentId(null);

      // Create submitted parameters object
      const newSubmittedParameters: SubmittedTrainingParameters = {
        engine: 'custom' as TrainingEngine,
        preset: algorithm,
        experimentName: experimentName || '',
        testSize,
        stratify,
        randomSeed
      };

      // Store in the global context
      setSubmittedParameters(newSubmittedParameters);

      // Convert hyperparameters to match the required type
      let processedHyperparameters: Record<string, any> = {};
    
      // Only process hyperparameters if not using defaults
      if (!useDefaultHyperparameters && selectedHyperparameters) {
        for (const [key, param] of Object.entries(selectedHyperparameters)) {
          // Extract just the value from each hyperparameter
          processedHyperparameters[key] = param.value;
        }
      }

      toast({
        title: "Training Started",
        description: `Starting custom training with ${algorithm}...`,
      });

      const result = await trainingLib.customTrain(
        datasetId,
        taskType,
        algorithm,
        testSize,
        stratify,
        randomSeed,
        finalExperimentName,
        processedHyperparameters,
        useDefaultHyperparameters,
      );

      if (result && result.experiment_id) {
        setLastTrainingType('custom');
        setActiveExperimentId(result.experiment_id);
        startPolling(result.experiment_id);
        setUserEditedName(false);

        toast({
          title: "Training Submitted",
          description: `Experiment ${finalExperimentName} started and now processing...`,
        });
      } else {
        throw new Error('No experiment ID returned from the server');
      }
    } catch (error) {
      console.error('Custom training error:', error);
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
    return !!(
      datasetId &&
      taskType &&
      algorithm &&
      testSize >= 0.1 &&
      testSize <= 0.5 &&
      processingStage === 'final' || processingStage === 'processed'
    );
  };

  const isButtonDisabled = () => {
    const formNotValid = !isFormValid();
    const isProcessing = experimentStatus === 'processing' || experimentStatus === 'running';
    const isSubmittingNow = isTraining || isSubmitting;

    return formNotValid || isProcessing || isSubmittingNow;
  };

  const getActiveSettings = () => {
    if (isTraining && submittedParameters) {
      return submittedParameters;
    } else {
      return {
        engine: 'custom' as TrainingEngine,
        preset: algorithm,
        experimentName: experimentName || '',
        testSize,
        stratify,
        randomSeed
      };
    }
  };

  const activeSettings = getActiveSettings();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-primary">
            <Rocket className="h-5 w-5" />
            Custom Training
            {isTraining && (
              <Badge className="ml-2 bg-amber-500">Training in Progress</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Customize your training with specific algorithms and hyperparameters
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
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                <h3 className="text-sm font-medium mb-2">Training Configuration</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">Engine:</span>{' '}
                    <span className="font-medium">CUSTOM</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Algorithm:</span>{' '}
                    <span className="font-medium capitalize">{activeSettings.preset || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Experiment:</span>{' '}
                    <span className="font-medium">{activeSettings.experimentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Test Size:</span>{' '}
                    <span className="font-medium">{(activeSettings.testSize * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Stratify:</span>{' '}
                    <span className="font-medium">{activeSettings.stratify ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Random Seed:</span>{' '}
                    <span className="font-medium">{activeSettings.randomSeed}</span>
                  </div>
                </div>
              </div>
            )}

            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600 mr-2" />
              <AlertDescription>
                <span className="font-semibold">Training continues in the background:</span> You can close this browser tab or window, and your training will continue on our servers. Return anytime to check progress.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Algorithm</Label>
              <Select
                value={algorithm}
                onValueChange={handleAlgorithmChange}
                disabled={isTraining || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Algorithm" />
                </SelectTrigger>
                <SelectContent>
                  {taskType &&
                    ALLOWED_ALGORITHMS[taskType].map((algo) => (
                      <SelectItem key={algo} value={algo}>
                        {algo}
                      </SelectItem>
                    ))}
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
                  </TooltipProvider>
                </Label>
              <Input
                id="experiment-name"
                value={experimentName || ''}
                onChange={handleExperimentNameChange}
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

              <div className="flex items-center justify-between">
                <Label htmlFor="use-default-hyperparameters" className="flex items-center gap-2">
                  Use Default Hyperparameters
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Use the default hyperparameters for the selected algorithm</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Switch
                  id="use-default-hyperparameters"
                  checked={useDefaultHyperparameters}
                  onCheckedChange={handleUseDefaultHyperparametersChange}
                  disabled={isTraining || isSubmitting || !algorithm}
                  aria-label="Use default hyperparameters"
                />
              </div>

              {!useDefaultHyperparameters && algorithm && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Hyperparameter Tuning</h4>
                  {selectedHyperparameters &&
                    Object.entries(selectedHyperparameters).map(([name, param]) => (
                      <div key={name} className="space-y-2">
                        <Label htmlFor={`hyperparameter-${name}`}>{name}</Label>
                        {param.type === 'number' ? (
                          <Input
                            id={`hyperparameter-${name}`}
                            type="number"
                            value={param.value as number}
                            onChange={(e) =>
                              handleHyperparameterChange(name, parseFloat(e.target.value))
                            }
                            disabled={isTraining || isSubmitting}
                          />
                        ) : param.type === 'boolean' ? (
                          <Checkbox
                            id={`hyperparameter-${name}`}
                            checked={param.value as boolean}
                            onCheckedChange={(checked) =>
                              handleHyperparameterChange(name, checked)
                            }
                            disabled={isTraining || isSubmitting}
                          />
                        ) : (
                          <Input
                            id={`hyperparameter-${name}`}
                            type="text"
                            value={param.value as string}
                            onChange={(e) =>
                              handleHyperparameterChange(name, e.target.value)
                            }
                            disabled={isTraining || isSubmitting}
                          />
                        )}
                      </div>
                    ))}
                </div>
              )}

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
                    Train Model with {algorithm}
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

export default CustomTraining;
