
import React, { useState, useEffect } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { useTraining } from '@/contexts/TrainingContext';
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
import CustomTrainingResults from './CustomTrainingResults';
import { ExperimentResults } from '@/types/training';

const CustomTraining: React.FC = () => {
  const { datasetId, targetColumn, taskType } = useDataset();
  const {
    isTraining,
    setIsTraining,
    customParameters,
    setCustomParameters,
    setCustomResult,
    setLastTrainingType,
    setError
  } = useTraining();
  const { toast } = useToast();
  const [experimentName, setExperimentName] = useState('');
  const [algorithms, setAlgorithms] = useState<string[]>([]);
  const [isLoadingAlgorithms, setIsLoadingAlgorithms] = useState(false);
  const [experimentId, setExperimentId] = useState<string | null>(null);
  const [experimentResults, setExperimentResults] = useState<ExperimentResults | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Fetch algorithms when task type changes
  useEffect(() => {
    if (taskType) {
      setIsLoadingAlgorithms(true);
      trainingApi.getAvailableAlgorithms(taskType)
        .then(algorithms => {
          setAlgorithms(algorithms);
          setIsLoadingAlgorithms(false);
        })
        .catch(error => {
          console.error('Error fetching algorithms:', error);
          setIsLoadingAlgorithms(false);
          // Fallback to constants
          setAlgorithms(ALLOWED_ALGORITHMS[taskType] || []);
        });
    }
  }, [taskType]);

  // Generate experiment name when algorithm changes
  useEffect(() => {
    if (customParameters.algorithm) {
      const newName = generateExperimentName('Custom', customParameters.algorithm.toUpperCase());
      setExperimentName(newName);
    }
  }, [customParameters.algorithm]);

  // Set default hyperparameters when algorithm changes
  useEffect(() => {
    if (customParameters.algorithm && customParameters.useDefaultHyperparameters) {
      const defaultParams = DEFAULT_HYPERPARAMETERS[customParameters.algorithm] || {};
      setCustomParameters({
        hyperparameters: defaultParams
      });
    }
  }, [customParameters.algorithm, customParameters.useDefaultHyperparameters]);

  // Fetch experiment results when experiment ID is available
  useEffect(() => {
    if (experimentId) {
      setIsLoadingResults(true);
      trainingApi.getExperimentResults(experimentId)
        .then(results => {
          setExperimentResults(results);
          setIsLoadingResults(false);
        })
        .catch(error => {
          console.error('Error fetching experiment results:', error);
          setIsLoadingResults(false);
          toast({
            title: "Error Fetching Results",
            description: "Unable to fetch experiment results. Please try again later.",
            variant: "destructive"
          });
        });
    }
  }, [experimentId, toast]);

  const toggleDefaultHyperparameters = () => {
    const newValue = !customParameters.useDefaultHyperparameters;
    setCustomParameters({ 
      useDefaultHyperparameters: newValue 
    });
    
    // Reset to defaults if useDefault is turned on
    if (newValue && customParameters.algorithm) {
      const defaultParams = DEFAULT_HYPERPARAMETERS[customParameters.algorithm] || {};
      setCustomParameters({
        hyperparameters: defaultParams
      });
    }
  };

  const handleTrainModel = async () => {
    if (!datasetId || !targetColumn || !taskType || !customParameters.algorithm) {
      toast({
        title: "Missing Required Fields",
        description: "Dataset ID, target column, task type, and algorithm are required",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsTraining(true);
      setError(null);
      setLastTrainingType('custom');
      setExperimentId(null);
      setExperimentResults(null);

      const { 
        algorithm, 
        hyperparameters, 
        testSize, 
        stratify, 
        randomSeed, 
        enableAnalytics, 
        useDefaultHyperparameters,
        enableVisualization
      } = customParameters;

      toast({
        title: "Training Started",
        description: `Starting custom training with ${algorithm}...`,
      });

      const response = await trainingApi.customTrain(
        datasetId,
        taskType,
        algorithm,
        useDefaultHyperparameters,
        hyperparameters,
        testSize,
        stratify,
        randomSeed,
        enableAnalytics,
        enableVisualization,
        experimentName || undefined,
        true // storeModel
      );

      // Extract experiment ID from response
      const respExperimentId = response?.data?.data?.experiment_id || response?.experiment_id;
      
      if (respExperimentId) {
        setExperimentId(respExperimentId);
        
        // Format the response to match our context state
        const formattedResult = {
          experimentId: respExperimentId,
          taskType: taskType,
          target: targetColumn,
          metrics: {},
          modelPath: '',
          completedAt: new Date().toISOString(),
          trainingTimeSec: 0,
          selectedAlgorithm: algorithm,
          modelFormat: '',
          experimentName: experimentName
        };

        setCustomResult(formattedResult);

        toast({
          title: "Training Submitted",
          description: `Custom training with ${algorithm} has been submitted. Fetching results...`,
        });
      } else {
        toast({
          title: "Training Initiated",
          description: `Custom training with ${algorithm} has started. Results will be available soon.`,
        });
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
    } finally {
      setIsTraining(false);
    }
  };

  const resetExperiment = () => {
    setExperimentId(null);
    setExperimentResults(null);
  };

  const isFormValid = () => {
    return !!(
      datasetId &&
      taskType &&
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
            {/* Algorithm Selection */}
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

            {/* Hyperparameters Section */}
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

            {/* Experiment Name */}
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

            {/* Test Set Split */}
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

            {/* Stratify Split */}
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

            {/* Random Seed */}
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

            {/* Enable Analytics */}
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
                checked={customParameters.enableAnalytics}
                onCheckedChange={(checked) => setCustomParameters({ enableAnalytics: checked })}
                disabled={isTraining}
                aria-label="Enable advanced analytics"
              />
            </div>

            {/* Enable Visualization */}
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

            {/* Train Button and Info */}
            <Button
              onClick={handleTrainModel}
              disabled={isTraining || !isFormValid()}
              className="w-full mt-4"
              size="lg"
            >
              {isTraining ? (
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
          </div>
        </CardContent>
      </Card>

      {/* Show loading state while fetching results */}
      {isLoadingResults && (
        <div className="p-8 text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Fetching experiment results...</p>
        </div>
      )}

      {/* Display training results if available */}
      {experimentResults && (
        <CustomTrainingResults 
          experimentResults={experimentResults} 
          onReset={resetExperiment}
        />
      )}
    </div>
  );
};

export default CustomTraining;
