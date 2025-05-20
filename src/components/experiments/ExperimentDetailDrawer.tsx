import React, { useState, useEffect } from 'react';
import { getExperimentResults } from '@/lib/training';
import { ExperimentResults as ExperimentResultsType } from '@/types/training';
import { useToast } from '@/hooks/use-toast';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader,
  SheetTitle, 
  SheetDescription,
  SheetClose
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Award, 
  BarChart4, 
  Clock, 
  Download, 
  FileText, 
  Layers,
  Activity,
  Microscope,
  Loader,
  AlertTriangle,
  Download as DownloadIcon,
  Image as ImageIcon,
  X,
  Sliders,
  Table as TableIcon,
  FileText as FileTextIcon,
  RefreshCw,
  Info
} from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { formatDateForGreece } from '@/lib/dateUtils';
import TuneModelModal from './TuneModelModal';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { downloadFile } from '@/components/training/prediction/utils/downloadUtils';
import MetricsGrid from '@/components/training/charts/MetricsGrid';
import { Progress } from '@/components/ui/progress';
import StatusBadge from '@/components/training/StatusBadge';

interface ExperimentDetailDrawerProps {
  experimentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

const ExperimentDetailDrawer: React.FC<ExperimentDetailDrawerProps> = ({
  experimentId,
  isOpen,
  onClose,
  onRefresh
}) => {
  const [results, setResults] = useState<ExperimentResultsType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('info');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isTuneModalOpen, setIsTuneModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && experimentId) {
      setActiveTab('info');
      setError(null);
      fetchExperimentDetails();
    } else {
      setResults(null);
    }
  }, [experimentId, isOpen]);

  const fetchExperimentDetails = async () => {
    if (!experimentId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching experiment details for:", experimentId);
      const data = await getExperimentResults(experimentId);
      
      if (data) {
        console.log("Successfully fetched experiment results:", data);
        setResults(data);
      } else {
        console.log("No results returned from API");
        setError("Failed to load experiment results");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load experiment results';
      console.error("Error fetching experiment results:", errorMessage);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderRunningState = () => {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">Training in Progress</h3>
          <p className="text-muted-foreground max-w-md">
            Your model is currently being trained. This process may take several minutes depending on dataset size and complexity.
          </p>
        </div>
        
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing</span>
              <StatusBadge status="running" />
            </div>
            <Progress indeterminate className="h-2" />
          </div>
          
          {results && (
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Experiment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {results.experiment_name && (
                    <>
                      <dt className="text-muted-foreground">Name:</dt>
                      <dd className="font-medium">{results.experiment_name}</dd>
                    </>
                  )}
                  
                  {results.task_type && (
                    <>
                      <dt className="text-muted-foreground">Task Type:</dt>
                      <dd className="font-medium">{results.task_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</dd>
                    </>
                  )}
                  
                  {results.target_column && (
                    <>
                      <dt className="text-muted-foreground">Target:</dt>
                      <dd className="font-medium">{results.target_column}</dd>
                    </>
                  )}
                  
                  {results.automl_engine && (
                    <>
                      <dt className="text-muted-foreground">Engine:</dt>
                      <dd className="font-medium">{results.automl_engine}</dd>
                    </>
                  )}
                  
                  {results.created_at && (
                    <>
                      <dt className="text-muted-foreground">Started:</dt>
                      <dd>{formatDistanceToNow(new Date(results.created_at))} ago</dd>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}
          
          <Button 
            variant="outline" 
            onClick={fetchExperimentDetails}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground max-w-md text-center mt-4">
          <p>You'll be notified when the training is complete. You can close this drawer and check back later.</p>
        </div>
      </div>
    );
  };

  const isExperimentRunning = results?.status === 'running';
  
  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="sm:max-w-xl md:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-xl flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Experiment Details
            </SheetTitle>
            {!isLoading && results && (
              <SheetDescription>
                {results.experiment_name || 'Unnamed Experiment'}
                {results.created_at && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Created {formatDistanceToNow(new Date(results.created_at))} ago
                  </span>
                )}
              </SheetDescription>
            )}
          </SheetHeader>
          
          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>Error: {error}</div>
          ) : isExperimentRunning ? (
            renderRunningState()
          ) : results ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="info">
                  <div className="flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    <span className="hidden sm:inline">Info</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="metrics">
                  <div className="flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    <span className="hidden sm:inline">Metrics</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="visuals">
                  <div className="flex items-center gap-1">
                    <BarChart4 className="h-4 w-4" />
                    <span className="hidden sm:inline">Visuals</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="download">
                  <div className="flex items-center gap-1">
                    <DownloadIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                  </div>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>General Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-y-2">
                      <div className="text-muted-foreground">Task Type:</div>
                      <div className="font-medium">{results.task_type}</div>
                      
                      <div className="text-muted-foreground">Status:</div>
                      <div>
                        <Badge 
                          variant={results.status === 'completed' || results.status === 'success' ? 'default' : 'secondary'}
                        >
                          {results.status}
                        </Badge>
                      </div>
                      
                      {results.training_type === 'automl' || results.automl_engine ? (
                        <>
                          <div className="text-muted-foreground">Engine:</div>
                          <div className="font-medium">{results.automl_engine}</div>
                        </>
                      ) : (
                        <>
                          <div className="text-muted-foreground">Algorithm:</div>
                          <div className="font-medium">{results.algorithm_choice || results.algorithm || 'Auto-selected'}</div>
                        </>
                      )}
                      
                      <div className="text-muted-foreground">Target Column:</div>
                      <div className="font-medium">{results.target_column}</div>
                      
                      {results.created_at && (
                        <>
                          <div className="text-muted-foreground">Created:</div>
                          <div>{new Date(results.created_at).toLocaleString()}</div>
                        </>
                      )}
                      
                      {results.completed_at && (
                        <>
                          <div className="text-muted-foreground">Completed:</div>
                          <div>{new Date(results.completed_at).toLocaleString()}</div>
                        </>
                      )}
                      
                      {results.training_time_sec && (
                        <>
                          <div className="text-muted-foreground">Training Time:</div>
                          <div>{results.training_time_sec.toFixed(2)} seconds</div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="metrics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>
                      Key metrics from model evaluation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Metrics rendering logic */}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="visuals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Visualizations</CardTitle>
                    <CardDescription>
                      Model performance visualizations and charts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Visualizations rendering logic */}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="download" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Model & Reports</CardTitle>
                    <CardDescription>
                      Download trained model and generated reports
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Download logic */}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 space-y-4">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">No Results Available</h3>
              <p className="text-center text-muted-foreground">
                No experiment data could be retrieved.
              </p>
            </div>
          )}
          
          <SheetClose asChild>
            <Button 
              variant="outline"
              className="mt-6"
              onClick={onClose}
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </SheetClose>
        </SheetContent>
      </Sheet>
      
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <div className="relative">
              <img 
                src={selectedImage} 
                alt="Visualization"
                className="w-full h-auto"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {results && (
        <TuneModelModal 
          experimentId={experimentId || ''}
          isOpen={isTuneModalOpen}
          onClose={() => setIsTuneModalOpen(false)}
          onSuccess={() => {
            setIsTuneModalOpen(false);
            toast({
              title: "Tuning Job Submitted",
              description: "Your model tuning job has been submitted successfully."
            });
            if (onRefresh) {
              onRefresh();
            }
          }}
          initialHyperparameters={results.hyperparameters}
          algorithm={results.algorithm || results.algorithm_choice || ''}
        />
      )}
    </>
  );
};

export default ExperimentDetailDrawer;
