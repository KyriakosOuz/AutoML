
import React, { useMemo } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart4, FileText, Table, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExperimentResults } from '@/types/training';
import { formatTrainingTime } from '@/utils/formatUtils';
import MetricsGrid from '../training/charts/MetricsGrid';

interface ExperimentDetailDrawerProps {
  experiment: ExperimentResults | null;
  isOpen: boolean;
  onClose: () => void;
}

const ExperimentDetailDrawer: React.FC<ExperimentDetailDrawerProps> = ({
  experiment,
  isOpen,
  onClose
}) => {
  const formatTaskType = (type?: string) => {
    if (!type) return "Unknown";
    
    switch (type) {
      case 'binary_classification':
        return 'Binary Classification';
      case 'multiclass_classification':
        return 'Multiclass Classification';
      case 'regression':
        return 'Regression';
      default:
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  // Filter metrics to remove duplicate specificity for H2O binary experiments
  const metricsToDisplay = useMemo(() => {
    if (!experiment?.metrics) return [];
    
    const uniqueMetricKeys = new Set();
    return Object.entries(experiment.metrics)
      .filter(([key]) => {
        // For h2o binary, only allow specificity once
        if (
          experiment.automl_engine === 'h2o' && 
          experiment.task_type === 'binary_classification' && 
          key === 'specificity'
        ) {
          if (uniqueMetricKeys.has(key)) {
            return false; // Skip duplicate
          }
        }
        uniqueMetricKeys.add(key);
        return true;
      });
  }, [experiment]);

  const formattedMetrics = useMemo(() => {
    return metricsToDisplay.map(([key, value]) => {
      let formattedKey = key
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
        
      // Format the value appropriately
      let formattedValue = typeof value === 'number' 
        ? value.toFixed(4)
        : String(value);
        
      // Convert to percentage for certain metrics
      if (['accuracy', 'precision', 'recall', 'f1', 'specificity', 'auc'].some(
        metric => key.toLowerCase().includes(metric)
      )) {
        if (typeof value === 'number') {
          formattedValue = `${(value * 100).toFixed(2)}%`;
        }
      }
        
      return {
        key,
        label: formattedKey,
        value: formattedValue
      };
    });
  }, [metricsToDisplay]);

  if (!experiment) {
    return null;
  }

  return (
    <Drawer open={isOpen} onOpenChange={open => !open && onClose()}>
      <DrawerContent className="max-h-[80vh] overflow-auto">
        <DrawerHeader className="sticky top-0 bg-background z-10 shadow-sm">
          <DrawerTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5" /> 
            {experiment.experiment_name || 'Experiment Details'}
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="p-4">
          <Card className="border border-primary/20 mb-4">
            <CardHeader className="bg-primary/5 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart4 className="h-4 w-4" /> 
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <div className="text-sm text-muted-foreground">Status:</div>
                <div>
                  <Badge variant={experiment.status === 'completed' ? 'success' : experiment.status === 'failed' ? 'destructive' : 'default'}>
                    {experiment.status}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground">Task Type:</div>
                <div className="text-sm">{formatTaskType(experiment.task_type)}</div>
                
                <div className="text-sm text-muted-foreground">Target Column:</div>
                <div className="text-sm">{experiment.target_column || 'N/A'}</div>
                
                <div className="text-sm text-muted-foreground">Engine:</div>
                <div className="text-sm">{experiment.automl_engine?.toUpperCase() || 'N/A'}</div>
                
                <div className="text-sm text-muted-foreground">Training Time:</div>
                <div className="text-sm">{formatTrainingTime(experiment.training_time_sec || 0)}</div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="metrics">
            <TabsList>
              <TabsTrigger value="metrics" className="flex items-center gap-1">
                <BarChart4 className="h-4 w-4" /> Metrics
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-1">
                <Table className="h-4 w-4" /> Details
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="metrics" className="pt-2">
              {experiment.status === 'failed' ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{experiment.error_message || 'Experiment failed'}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <MetricsGrid metrics={formattedMetrics} />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="details" className="pt-2">
              <Card>
                <CardContent className="pt-4">
                  <pre className="text-xs overflow-auto max-h-[400px] p-2 bg-muted rounded-md">
                    {JSON.stringify(experiment, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ExperimentDetailDrawer;
