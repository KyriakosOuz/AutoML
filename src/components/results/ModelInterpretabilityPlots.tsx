
import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ImageIcon, Info } from 'lucide-react';
import { TrainingFile, PDPICEMetadata, ExperimentResults } from '@/types/training';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PlotMetadata {
  id: string;
  type: string;
  feature?: string;
  class?: string | null;
  url: string;
  fileName?: string;
  category?: 'pdp' | 'ice' | 'other';
}

interface ModelInterpretabilityPlotsProps {
  // Allow either files array or full results object
  files: TrainingFile[] | ExperimentResults;
  showCategoryTabs?: boolean;
}

const ModelInterpretabilityPlots: React.FC<ModelInterpretabilityPlotsProps> = ({ files, showCategoryTabs = false }) => {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  // Process the input to extract plot metadata
  const plotsMetadata = useMemo(() => {
    console.log("[ModelInterpretabilityPlots] Processing input:", files);
    
    // Determine if we're working with an ExperimentResults object or TrainingFile[]
    const isExperimentResults = 'pdp_ice_metadata' in files || 'files' in files;
    
    let processedMetadata: PlotMetadata[] = [];

    if (isExperimentResults) {
      const results = files as ExperimentResults;
      
      // First try to use pdp_ice_metadata if available
      if (results.pdp_ice_metadata && results.pdp_ice_metadata.length > 0) {
        console.log("[ModelInterpretabilityPlots] Using pdp_ice_metadata with", 
                    results.pdp_ice_metadata.length, "items");
        
        processedMetadata = results.pdp_ice_metadata.map((meta: PDPICEMetadata) => {
          const fileType = meta.file_type || '';
          const category = fileType.startsWith('pdp_') ? 'pdp' : 
                          fileType.startsWith('ice_') ? 'ice' : 'other';
                          
          // Extract feature and class from the file type if not provided directly
          let feature = meta.feature;
          let classValue = meta.class;
          
          if (!feature || !classValue) {
            const parts = fileType.split('_');
            if (parts.length >= 3) {
              feature = feature || parts[1];
              classValue = classValue || parts.slice(2).join('_');
            }
          }
          
          return {
            id: meta.file_url,
            type: fileType,
            feature: feature || '',
            class: classValue,
            url: meta.file_url,
            fileName: `${fileType}.png`,
            category: category as 'pdp' | 'ice' | 'other'
          };
        });
      } 
      // Then fallback to files array if available
      else if (results.files && results.files.length > 0) {
        const fileList = results.files;
        
        // Process files with pdp_ or ice_ prefixes
        processedMetadata = fileList
          .filter(file => 
            file.file_type.startsWith('pdp_') || 
            file.file_type.startsWith('ice_')
          )
          .map(file => {
            const fileType = file.file_type;
            const parts = fileType.split('_');
            const category = fileType.startsWith('pdp_') ? 'pdp' : 'ice';
            
            // Extract feature and class from the file type
            let feature = '';
            let classValue = null;
            
            if (parts.length >= 3) {
              feature = parts[1];
              classValue = parts.slice(2).join('_');
            } else if (parts.length === 2) {
              feature = parts[1];
            }
            
            return {
              id: file.file_id,
              type: fileType,
              feature,
              class: classValue,
              url: file.file_url,
              fileName: file.file_name || `${fileType}.png`,
              category: category as 'pdp' | 'ice' | 'other'
            };
          });
      }
    } else {
      // Handle TrainingFile[] input
      const fileList = files as TrainingFile[];
      
      // Process files with pdp_ or ice_ prefixes
      processedMetadata = fileList
        .filter(file => 
          file.file_type.startsWith('pdp_') || 
          file.file_type.startsWith('ice_')
        )
        .map(file => {
          const fileType = file.file_type;
          const parts = fileType.split('_');
          const category = fileType.startsWith('pdp_') ? 'pdp' : 'ice';
          
          // Extract feature and class from the file type
          let feature = '';
          let classValue = null;
          
          if (parts.length >= 3) {
            feature = parts[1];
            classValue = parts.slice(2).join('_');
          } else if (parts.length === 2) {
            feature = parts[1];
          }
          
          return {
            id: file.file_id,
            type: fileType,
            feature,
            class: classValue,
            url: file.file_url,
            fileName: file.file_name || `${fileType}.png`,
            category: category as 'pdp' | 'ice' | 'other'
          };
        });
    }

    console.log("[ModelInterpretabilityPlots] Processed metadata:", processedMetadata);
    return processedMetadata;
  }, [files]);

  // Extract unique features and classes for filtering
  const { uniqueFeatures, uniqueClasses } = useMemo(() => {
    const features = new Set<string>();
    const classes = new Set<string>();
    
    plotsMetadata.forEach(plot => {
      if (plot.feature) features.add(plot.feature);
      if (plot.class) classes.add(plot.class);
    });
    
    return {
      uniqueFeatures: Array.from(features),
      uniqueClasses: Array.from(classes).filter(c => c !== null) as string[]
    };
  }, [plotsMetadata]);

  // Filter plots based on selected feature and class
  const filteredPlots = useMemo(() => {
    let filtered = [...plotsMetadata];
    
    if (selectedFeature) {
      filtered = filtered.filter(plot => plot.feature === selectedFeature);
    }
    
    if (selectedClass) {
      filtered = filtered.filter(plot => plot.class === selectedClass);
    }
    
    return filtered;
  }, [plotsMetadata, selectedFeature, selectedClass]);

  // Split plots by category
  const categorizedPlots = useMemo(() => {
    const pdpPlots = filteredPlots.filter(plot => plot.category === 'pdp');
    const icePlots = filteredPlots.filter(plot => plot.category === 'ice');
    const otherPlots = filteredPlots.filter(plot => !['pdp', 'ice'].includes(plot.category || ''));
    
    return { pdpPlots, icePlots, otherPlots };
  }, [filteredPlots]);

  // Handler for feature selection
  const handleFeatureSelect = (feature: string) => {
    setSelectedFeature(feature === selectedFeature ? null : feature);
  };

  // Handler for class selection
  const handleClassSelect = (classValue: string) => {
    setSelectedClass(classValue === selectedClass ? null : classValue);
  };

  // If no plots are available
  if (plotsMetadata.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Interpretability Plots Available</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          No PDP or ICE plots were found for this experiment.
        </p>
      </div>
    );
  }

  // Log info about what we're rendering
  console.log("[ModelInterpretabilityPlots] Rendering with:", {
    totalPlots: plotsMetadata.length,
    filteredPlots: filteredPlots.length,
    uniqueFeatures,
    uniqueClasses,
    selectedFeature,
    selectedClass
  });

  // Helper function to format plot type for display
  const formatPlotType = (type: string): string => {
    if (type.startsWith('pdp_')) {
      return 'Partial Dependence Plot';
    } else if (type.startsWith('ice_')) {
      return 'Individual Conditional Expectation';
    }
    return type.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filter Plots</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2 text-xs">
                    <p><strong>PDP (Partial Dependence Plot)</strong>: Shows the marginal effect of a feature on the predicted outcome.</p>
                    <p><strong>ICE (Individual Conditional Expectation)</strong>: Shows how the prediction changes for individual data points when a feature value changes.</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-medium">Features</h4>
              <div className="flex flex-wrap gap-2">
                {uniqueFeatures.map(feature => (
                  <Button
                    key={feature}
                    size="sm"
                    variant={selectedFeature === feature ? "default" : "outline"}
                    onClick={() => handleFeatureSelect(feature)}
                  >
                    {feature}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="mb-2 text-sm font-medium">Classes</h4>
              <div className="flex flex-wrap gap-2">
                {uniqueClasses.map(classValue => (
                  <Button
                    key={classValue}
                    size="sm"
                    variant={selectedClass === classValue ? "default" : "outline"}
                    onClick={() => handleClassSelect(classValue)}
                  >
                    {classValue}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Plots Display Section */}
      {showCategoryTabs ? (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Plots</TabsTrigger>
            <TabsTrigger value="pdp">PDP</TabsTrigger>
            <TabsTrigger value="ice">ICE</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlots.map((plot) => renderPlotCard(plot))}
            </div>
          </TabsContent>
          
          <TabsContent value="pdp" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorizedPlots.pdpPlots.map((plot) => renderPlotCard(plot))}
            </div>
          </TabsContent>
          
          <TabsContent value="ice" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorizedPlots.icePlots.map((plot) => renderPlotCard(plot))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlots.map((plot) => renderPlotCard(plot))}
        </div>
      )}
    </div>
  );

  // Helper function to render a plot card
  function renderPlotCard(plot: PlotMetadata) {
    const title = plot.feature ? 
      `${plot.feature} ${plot.class ? `(${plot.class})` : ''}` : 
      formatPlotType(plot.type);
    
    const badge = plot.category === 'pdp' ? 'PDP' : plot.category === 'ice' ? 'ICE' : '';
    
    return (
      <Dialog key={plot.id}>
        <DialogTrigger asChild>
          <Card className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="aspect-video bg-muted flex items-center justify-center rounded-md relative overflow-hidden">
                <div 
                  className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${plot.url})` }}
                />
                <div className="absolute inset-0 bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors" />
                {badge && (
                  <span className="absolute top-2 right-2 bg-primary/20 text-primary text-xs font-medium px-2 py-1 rounded-full">
                    {badge}
                  </span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm font-medium truncate">{title}</p>
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <div className="p-1">
            <img 
              src={plot.url} 
              alt={title}
              className="w-full rounded-md"
            />
            <div className="mt-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium">{title}</h3>
                <p className="text-sm text-muted-foreground">{formatPlotType(plot.type)}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={plot.url} download={plot.fileName || `${plot.type}.png`} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
};

export default ModelInterpretabilityPlots;
