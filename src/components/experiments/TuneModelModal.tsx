import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuthHeaders } from '@/lib/utils';
import { trainingApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface TuneModelModalProps {
  experimentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialHyperparameters?: Record<string, any>;
  algorithm: string;
}

interface ApiResponse {
  status: string;
  message: string;
  data?: any;
}

const TuneModelModal: React.FC<TuneModelModalProps> = ({
  experimentId,
  isOpen,
  onClose,
  onSuccess,
  initialHyperparameters = {},
  algorithm
}) => {
  const navigate = useNavigate();
  const [hyperparameters, setHyperparameters] = useState<Record<string, any>>(
    () => {
      const initialParams: Record<string, string> = {};
      Object.entries(initialHyperparameters || {}).forEach(([key, value]) => {
        initialParams[key] = String(value);
      });
      return initialParams;
    }
  );
  
  const [paramKeys, setParamKeys] = useState<string[]>(
    () => Object.keys(initialHyperparameters || {})
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingParams, setIsFetchingParams] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (isOpen && algorithm) {
      fetchHyperparameters();
    }
  }, [isOpen, algorithm]);
  
  const fetchHyperparameters = async () => {
    if (!algorithm) return;
    
    setIsFetchingParams(true);
    
    try {
      const hyperparamsData = await trainingApi.getAvailableHyperparameters(algorithm);
      
      if (hyperparamsData) {
        const fetchedParams: Record<string, string> = {};
        Object.entries(hyperparamsData).forEach(([key, value]) => {
          fetchedParams[key] = String(value);
        });
        
        setHyperparameters(fetchedParams);
        setParamKeys(Object.keys(fetchedParams));
        
        toast({
          title: "Hyperparameters loaded",
          description: `Loaded default parameters for ${algorithm}`,
        });
      }
    } catch (error) {
      console.error("Error fetching hyperparameters:", error);
      toast({
        title: "Error",
        description: "Failed to fetch hyperparameters. Using stored values instead.",
        variant: "destructive"
      });
    } finally {
      setIsFetchingParams(false);
    }
  };
  
  const handleDeleteParam = (key: string) => {
    const updatedParams = { ...hyperparameters };
    delete updatedParams[key];
    setParamKeys(paramKeys.filter(k => k !== key));
    setHyperparameters(updatedParams);
  };
  
  const handleParamChange = (key: string, value: string) => {
    setHyperparameters({ ...hyperparameters, [key]: value });
  };
  
  const handleKeyChange = (oldKey: string, newKey: string) => {
    if (newKey === oldKey || newKey.trim() === '') return;
    
    const updatedParams = { ...hyperparameters };
    const value = updatedParams[oldKey];
    delete updatedParams[oldKey];
    updatedParams[newKey] = value;
    
    const updatedKeys = paramKeys.map(k => k === oldKey ? newKey : k);
    
    setHyperparameters(updatedParams);
    setParamKeys(updatedKeys);
  };
  
  const parseHyperparameters = () => {
    const parsedParams: Record<string, any> = {};
    
    Object.entries(hyperparameters).forEach(([key, valueStr]) => {
      if (key.trim() === '' || valueStr.trim() === '') return;
      
      let parsedValue: any = valueStr;
      
      if (!isNaN(Number(valueStr))) {
        parsedValue = Number(valueStr);
      } 
      else if (valueStr.toLowerCase() === 'true') {
        parsedValue = true;
      } 
      else if (valueStr.toLowerCase() === 'false') {
        parsedValue = false;
      }
      
      parsedParams[key] = parsedValue;
    });
    
    return parsedParams;
  };
  
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const parsedParams = parseHyperparameters();
    
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`http://localhost:8000/experiments/tune-model/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          experiment_id: experimentId,
          new_hyperparameters: parsedParams
        })
      });
      
      const data: ApiResponse = await response.json();
      
      if (data.status === 'success') {
        toast({
          title: "Success",
          description: "Model tuning started successfully!",
        });
        
        const newExperimentId = data.data?.experiment_id;
        
        onSuccess();
        onClose();
        
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('refresh-experiments'));
          
          if (newExperimentId) {
            navigate(`/experiments/${newExperimentId}`);
          }
        }, 500);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to start model tuning",
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error("Model tuning error:", errorMessage);
      toast({
        title: "Error",
        description: "Failed to connect to the server. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tune Model Hyperparameters</DialogTitle>
          <DialogDescription>
            Adjust hyperparameters to fine-tune this model
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {isFetchingParams ? (
            <div className="flex items-center justify-center py-6">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading hyperparameters...</span>
            </div>
          ) : paramKeys.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No hyperparameters available for this algorithm.
            </div>
          ) : (
            paramKeys.map((key) => (
              <div key={key} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
                <div>
                  <Label htmlFor={`key-${key}`} className="text-xs">
                    Parameter Name
                  </Label>
                  <Input
                    id={`key-${key}`}
                    value={key}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor={`value-${key}`} className="text-xs">
                    Value
                  </Label>
                  <Input
                    id={`value-${key}`}
                    value={hyperparameters[key] || ''}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                    placeholder="e.g. 5"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-6"
                  onClick={() => handleDeleteParam(key)}
                >
                  ✕
                </Button>
              </div>
            ))
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || paramKeys.length === 0}>
            {isSubmitting ? (
              <>
                <Loader className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              'Tune Model'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TuneModelModal;
