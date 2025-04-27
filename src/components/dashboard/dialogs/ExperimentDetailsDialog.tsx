
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/training/StatusBadge';
import { API_BASE_URL } from '@/lib/constants';
import { handleApiResponse, getAuthHeaders } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Settings, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Experiment {
  experiment_id: string;
  experiment_name: string;
  task_type: string;
  algorithm: string;
  status: 'running' | 'completed' | 'failed' | 'success';
  created_at: string;
  completed_at: string | null;
  dataset_id: string;
  dataset_name: string;
  model_file_url?: string;
}

interface ExperimentDetailsDialogProps {
  experiment: Experiment;
  open: boolean;
  onClose: () => void;
}

interface ExperimentDetails {
  experiment_id: string;
  experiment_name: string;
  task_type: string;
  algorithm: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  dataset_name: string;
  training_time_sec?: number;
  hyperparameters?: Record<string, any>;
  metrics?: Record<string, any>;
  confusion_matrix?: number[][];
  feature_importance?: Array<{ feature: string; importance: number }>;
  error_message?: string | null;
}

const ExperimentDetailsDialog: React.FC<ExperimentDetailsDialogProps> = ({
  experiment,
  open,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [details, setDetails] = useState<ExperimentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open && experiment.experiment_id) {
      fetchExperimentDetails(experiment.experiment_id);
    }
  }, [open, experiment.experiment_id]);

  const fetchExperimentDetails = async (experimentId: string) => {
    if (!experimentId) {
      toast({
        title: 'Error',
        description: 'Invalid experiment ID',
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }
    
    console.log('Fetching details for experiment ID:', experimentId);
    
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/experiments/experiment-results/${experimentId}`, {
        method: 'GET',
        headers
      });
      
      const result = await handleApiResponse<ExperimentDetails>(response);
      
      if (result.data) {
        setDetails(result.data as ExperimentDetails);
      } else {
        setDetails(result as ExperimentDetails);
      }
    } catch (error) {
      console.error('Error fetching experiment details:', error);
      toast({
        title: 'Failed to load experiment details',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
      setDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMetric = (value: number) => {
    return Number(value).toFixed(4);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{experiment.experiment_name}</DialogTitle>
            <StatusBadge status={experiment.status} />
          </div>
          <DialogDescription className="flex flex-wrap gap-2 items-center mt-2">
            <Badge variant="outline">{experiment.task_type}</Badge>
            <Badge variant="secondary">{experiment.algorithm}</Badge>
            <span className="text-xs text-muted-foreground">Created: {formatDate(experiment.created_at)}</span>
          </DialogDescription>
        </DialogHeader>
        
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 overflow-hidden flex flex-col mt-4"
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="hyperparameters">Hyperparameters</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-auto mt-4">
            <TabsContent value="overview" className="h-full">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Model Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="font-medium">Algorithm:</dt>
                          <dd>{experiment.algorithm}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium">Task Type:</dt>
                          <dd>{experiment.task_type}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium">Dataset:</dt>
                          <dd>{experiment.dataset_name}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium">Status:</dt>
                          <dd><StatusBadge status={experiment.status} /></dd>
                        </div>
                        {details?.training_time_sec && (
                          <div className="flex justify-between">
                            <dt className="font-medium">Training Time:</dt>
                            <dd>{details.training_time_sec.toFixed(2)} seconds</dd>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <dt className="font-medium">Created:</dt>
                          <dd>{formatDate(experiment.created_at)}</dd>
                        </div>
                        {experiment.completed_at && (
                          <div className="flex justify-between">
                            <dt className="font-medium">Completed:</dt>
                            <dd>{formatDate(experiment.completed_at)}</dd>
                          </div>
                        )}
                      </dl>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Key Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!details?.metrics || Object.keys(details.metrics).length === 0 ? (
                        <p className="text-muted-foreground text-sm">No metrics available</p>
                      ) : (
                        <dl className="space-y-2 text-sm">
                          {Object.entries(details.metrics).slice(0, 5).map(([key, value]) => (
                            <div className="flex justify-between" key={key}>
                              <dt className="font-medium">{key.replace(/_/g, ' ')}:</dt>
                              <dd>{formatMetric(value)}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </CardContent>
                  </Card>
                  
                  {details?.error_message && (
                    <Card className="col-span-1 md:col-span-2 border-destructive">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-destructive">Error Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-destructive">{details.error_message}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="metrics" className="h-full">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : !details?.metrics || Object.keys(details.metrics).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No metrics available for this experiment.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(details.metrics).map(([key, value]) => (
                          <div key={key} className="border rounded-lg p-4">
                            <p className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                            <p className="text-2xl font-bold mt-1">{formatMetric(value)}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="hyperparameters" className="h-full">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : !details?.hyperparameters || Object.keys(details.hyperparameters).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hyperparameters available for this experiment.</p>
                </div>
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Hyperparameters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2">
                      {Object.entries(details.hyperparameters).map(([key, value]) => (
                        <div key={key} className="flex justify-between border-b pb-2 last:border-0">
                          <dt className="font-medium">{key.replace(/_/g, ' ')}:</dt>
                          <dd className="text-right">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>
        
        <DialogFooter className="pt-4 flex flex-wrap justify-between">
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => fetchExperimentDetails(experiment.experiment_id)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            {experiment.status === 'completed' && (
              <Button variant="outline" asChild>
                <Link to={`/training?experiment=${experiment.experiment_id}`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Open in Training
                </Link>
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {experiment.model_file_url && experiment.status === 'completed' && (
              <Button 
                variant="secondary"
                asChild
              >
                <a 
                  href={experiment.model_file_url} 
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Model
                </a>
              </Button>
            )}
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExperimentDetailsDialog;
