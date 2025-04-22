
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useDataset } from '@/contexts/DatasetContext';
import { useTraining } from '@/contexts/TrainingContext';
import { trainingApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const CustomTraining: React.FC = () => {
  const { datasetId, taskType } = useDataset();
  const { 
    setIsTraining, 
    setLastTrainingType, 
    setCustomParameters,
    startPolling 
  } = useTraining();

  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('');
  const [availableAlgorithms, setAvailableAlgorithms] = useState<string[]>([]);
  const [hyperparameters, setHyperparameters] = useState<Record<string, string>>({});

  // Fetch available algorithms when task type is known
  React.useEffect(() => {
    const fetchAlgorithms = async () => {
      if (taskType) {
        try {
          const algorithms = await trainingApi.getAvailableAlgorithms(taskType);
          setAvailableAlgorithms(algorithms);
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to fetch available algorithms',
            variant: 'destructive'
          });
        }
      }
    };
    
    fetchAlgorithms();
  }, [taskType]);

  const handleAlgorithmChange = async (algorithm: string) => {
    setSelectedAlgorithm(algorithm);
    
    try {
      const algorithmHyperparameters = await trainingApi.getAvailableHyperparameters(algorithm);
      setHyperparameters(
        algorithmHyperparameters.reduce((acc, param) => ({
          ...acc,
          [param.name]: param.default_value
        }), {})
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch hyperparameters',
        variant: 'destructive'
      });
    }
  };

  const handleTrainingStart = async () => {
    if (!datasetId || !selectedAlgorithm) {
      toast({
        title: 'Validation Error',
        description: 'Please select a dataset and algorithm',
        variant: 'destructive'
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('dataset_id', datasetId);
      formData.append('algorithm', selectedAlgorithm);
      formData.append('use_default_hyperparams', 'true');
      
      const result = await trainingApi.customTrain(formData);
      
      setIsTraining(true);
      setLastTrainingType('custom');
      startPolling(result.experiment_id);
    } catch (error) {
      toast({
        title: 'Training Error',
        description: 'Failed to start training',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Model Training</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Select Algorithm</Label>
          <Select 
            value={selectedAlgorithm} 
            onValueChange={handleAlgorithmChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose an algorithm" />
            </SelectTrigger>
            <SelectContent>
              {availableAlgorithms.map(algo => (
                <SelectItem key={algo} value={algo}>{algo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAlgorithm && (
          <div className="space-y-4">
            <Button 
              onClick={handleTrainingStart} 
              disabled={!selectedAlgorithm}
            >
              Start Training
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomTraining;

