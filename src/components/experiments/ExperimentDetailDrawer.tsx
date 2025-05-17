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
  Filter
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
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface ExperimentDetailDrawerProps {
  experimentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

interface VisualizationFile {
  file_url: string;
  file_type: string;
  file_name?: string;
  class_label?: string;
  category?: string;
}

interface ModelFile {
  file_url: string;
  file_type: string;
  file_name?: string;
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
  
  // New states for class label filtering
  const [selectedClassLabels, setSelectedClassLabels] = useState<string[]>([]);
  const [availableClassLabels, setAvailableClassLabels] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && experimentId) {
      setActiveTab('info');
      setError(null);
      fetchExperimentDetails();
    } else {
      setResults(null);
    }
  }, [experimentId, isOpen]);

  useEffect(() => {
    if (results) {
      // Extract unique class labels from visualization files
      const classLabels = getVisualizationFiles()
        .map(file => file.class_label)
        .filter((label, index, self): label is string => 
          !!label && self.indexOf(label) === index
        );
      
      setAvailableClassLabels(classLabels);
    }
  }, [results]);

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

  // Extract class label from file name if possible
  const getClassLabelFromFileName = (fileName: string | undefined): string | undefined => {
    if (!fileName) return undefined;
    
    // Check for common class label patterns in filenames
    const iceAgeMatch = fileName.match(/ice\s*age\s*(\d+)/i);
    if (iceAgeMatch) return `Ice Age ${iceAgeMatch[1]}`;
    
    const classMatch = fileName.match(/class[_\s-]*(\d+|[a-z]+)/i);
    if (classMatch) return `Class ${classMatch[1]}`;
    
    return undefined;
  };

  // Helper function to get visualization files from results
  const getVisualizationFiles = (): VisualizationFile[] => {
    if (!results || !results.files) return [];
    
    // Filter files to only include visualization types
    const visualTypes = [
      'confusion_matrix', 'roc_curve', 'precision_recall', 'feature_importance', 
      'learning_curve', 'shap', 'partial_dependence', 'ice', 'residuals', 'calibration',
      'chart', 'plot', 'graph', 'visualization', 'distribution', 'ice_age'
    ];
    
    const files = (results.files || [])
      .filter(file => visualTypes.some(type => 
        file.file_type?.toLowerCase().includes(type) || 
        (file.file_name && file.file_name.toLowerCase().includes(type))
      ))
      .map(file => {
        const classLabel = getClassLabelFromFileName(file.file_name);
        const category = getCategoryFromFileType(file.file_type || file.file_name || '');
        
        return {
          file_url: file.file_url,
          file_type: file.file_type || 'visualization',
          file_name: file.file_name,
          class_label: classLabel,
          category
        };
      });
      
    return files;
  };
  
  // Update the function to filter visualizations based on class labels only
  const getFilteredVisualizations = () => {
    const allVisuals = getVisualizationFiles();
    
    return allVisuals.filter(visual => {
      // Only filter by class label if selections are made
      const classLabelMatch = selectedClassLabels.length === 0 || 
        (visual.class_label && selectedClassLabels.includes(visual.class_label));
      
      return classLabelMatch;
    });
  };

  const renderLoadingState = () => (
    <div className="space-y-4 p-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
      <Skeleton className="h-[125px] w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-[125px]" />
        <Skeleton className="h-[125px]" />
      </div>
    </div>
  );
  
  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h3 className="text-xl font-semibold text-destructive">Error Loading Results</h3>
      <p className="text-center text-muted-foreground">{error}</p>
      <Button onClick={fetchExperimentDetails}>
        Try Again
      </Button>
    </div>
  );

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
            renderLoadingState()
          ) : error ? (
            renderErrorState()
          ) : results ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="info">
                  <div className="flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    <span className="hidden sm:inline">Info</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="visuals">
                  <div className="flex items-center gap-1">
                    <BarChart4 className="h-4 w-4" />
                    <span className="hidden sm:inline">Visuals</span>
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
                    </div>
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
                    {getVisualizationFiles().length > 0 ? (
                      <div className="space-y-6">
                        {/* Class Label filtering UI */}
                        {availableClassLabels.length > 0 && (
                          <div className="flex flex-col sm:flex-row gap-3 mb-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9">
                                  <Filter className="h-4 w-4 mr-2" />
                                  Filter by Class
                                  {selectedClassLabels.length > 0 && (
                                    <Badge variant="secondary" className="ml-2 px-1 py-0">
                                      {selectedClassLabels.length}
                                    </Badge>
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-56">
                                {availableClassLabels.map(label => (
                                  <DropdownMenuCheckboxItem
                                    key={label}
                                    checked={selectedClassLabels.includes(label)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedClassLabels([...selectedClassLabels, label]);
                                      } else {
                                        setSelectedClassLabels(
                                          selectedClassLabels.filter(l => l !== label)
                                        );
                                      }
                                    }}
                                  >
                                    {label}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}

                        {/* Filtered visualizations */}
                        <div>
                          <h3 className="text-lg font-medium mb-3">Charts & Plots</h3>
                          {getFilteredVisualizations().length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {getFilteredVisualizations().map((file, index) => (
                                <div 
                                  key={index}
                                  className="overflow-hidden rounded-md border cursor-pointer hover:border-primary/50 transition-colors"
                                  onClick={() => setSelectedImage(file.file_url)}
                                >
                                  <div className="aspect-[4/3] relative bg-muted">
                                    <img 
                                      src={file.file_url} 
                                      alt={file.file_type} 
                                      className="object-cover w-full h-full"
                                      onError={(e) => {
                                        e.currentTarget.src = 'https://placehold.co/400x300?text=Error+Loading+Image';
                                      }}
                                    />
                                  </div>
                                  <div className="p-2">
                                    <p className="text-xs font-medium capitalize">
                                      {file.class_label || file.category || file.file_type.replace(/_/g, ' ')}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-8 text-center text-muted-foreground">
                              No matching visualizations found
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mb-4" />
                        <p>No visualizations available for this experiment</p>
                      </div>
                    )}
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
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Visualization Detail
              </DialogTitle>
            </DialogHeader>
            <div className="relative">
              <img 
                src={selectedImage} 
                alt="Visualization"
                className="w-full h-auto"
              />
              <Button 
                size="sm"
                className="absolute top-2 right-2"
                variant="secondary"
                onClick={() => {
                  const filename = selectedImage.split('/').pop() || 'visualization.png';
                  downloadFile(selectedImage, filename);
                  toast({
                    title: "Download Started",
                    description: `Downloading ${filename}...`
                  });
                }}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Download
              </Button>
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
