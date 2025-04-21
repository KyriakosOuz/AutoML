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
import { AlertCircle, Beaker, HelpCircle, Play, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateExperimentName } from '@/lib/constants';
import { ALLOWED_ALGORITHMS, DEFAULT_HYPERPARAMETERS } from '@/lib/constants';
import HyperParameterEditor from './HyperParameterEditor';

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

  useEffect(() => {
    if (customParameters.algorithm) {
      const newName = generateExperimentName('Custom', customParameters.algorithm.toUpperCase());
      setExperimentName(newName);
    }
  }, [customParameters.algorithm]);

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

      const { algorithm, hyperparameters, testSize, stratify, randomSeed, enableAnalytics } = customParameters;

      toast({
        title: "Training Started",
        description: `Starting custom training with ${algorithm}...`,
      });

      const response = await trainingApi.customTrain(
        datasetId,
        taskType,
        algorithm,
        hyperparameters,
        testSize,
        stratify,
        randomSeed,
        enableAnalytics,
        experimentName || undefined,
        true // storeModel
      );

      // Format the response to match our context state
      const formattedResult = {
        experimentId: response.experiment_id,
        taskType: response.task_type,
        target: response.target,
        metrics: response.metrics,
        modelPath: response.model_path,
        completedAt: response.completed_at,
        trainingTimeSec: response.training_time_sec,
        selectedAlgorithm: algorithm,
        modelFormat: response.model_format
      };

      setCustomResult(formattedResult);

      toast({
        title: "Training Complete",
        description: `Custom training with ${algorithm} completed successfully`,
      });
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

  const isFormValid = () => {
    return !!(
      datasetId &&
      taskType &&
      customParameters.algorithm &&
      customParameters.testSize >= 0.1 &&
      customParameters.testSize <= 0.5
    );
  };

  // Add this effect to handle algorithm selection
  useEffect(() => {
    if (customParameters.algorithm) {
      const defaultParams = DEFAULT_HYPERPARAMETERS[customParameters.algorithm] || {};
      setCustomParameters({
        hyperparameters: defaultParams
      });
    }
  }, [customParameters.algorithm]);

  const algorithms = taskType ? ALLOWED_ALGORITHMS[taskType] : [];

  return (
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
          <Alert className="bg-secondary/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Fields marked with * are required
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Algorithm</Label>
            <Select
              value={customParameters.algorithm}
              onValueChange={(value) => setCustomParameters({ algorithm: value })}
              disabled={isTraining}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select algorithm" />
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
              <Label>Hyperparameters</Label>
              <HyperParameterEditor
                hyperparameters={customParameters.hyperparameters}
                onChange={(params) => setCustomParameters({ hyperparameters: params })}
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
                    <p>Optional name to identify this training experiment</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="experiment-name"
              value={experimentName}
              readOnly
              className="bg-muted"
              disabled={isTraining}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                Test Set Split *
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Percentage of data used for testing model performance (20% recommended)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
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
                Stratify Split *
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
              Random Seed *
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
              <Label htmlFor="enable-analytics" className="flex items-center gap-2">
                Enable Advanced Analytics *
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

          <Button
            onClick={handleTrainModel}
            disabled={isTraining || !isFormValid()}
            className="w-full mt-4"
            size="lg"
          >
            {isTraining ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
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
  );
};

export default CustomTraining;
