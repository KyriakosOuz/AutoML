
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, AlertTriangle } from 'lucide-react';
import { PdpIceMetadataItem } from '@/types/training';

interface ModelInterpretabilityPlotsProps {
  pdpIceMetadata?: PdpIceMetadataItem[];
  taskType?: string;
}

const formatFileType = (fileType: string): string => {
  if (!fileType) return '';
  
  // Convert file type to a cleaner display format
  let displayType = fileType
    .replace(/_/g, ' ')
    .replace(/pdp/i, 'PDP')
    .replace(/ice/i, 'ICE');
    
  // Remove any class or feature names that might be in the file_type
  displayType = displayType
    .replace(/NO2/g, '')
    .replace(/Population Density/g, '')
    .replace(/Good|Poor|Moderate|Hazardous/g, '')
    .trim();
    
  return displayType;
};

const extractFeatureAndClass = (fileType: string): { feature?: string; class?: string } => {
  const result: { feature?: string; class?: string } = {};
  
  // Extract feature
  if (fileType.includes('Population_Density')) {
    result.feature = 'Population Density';
  } else if (fileType.includes('NO2')) {
    result.feature = 'NO2';
  }
  
  // Extract class
  if (fileType.includes('_Good')) {
    result.class = 'Good';
  } else if (fileType.includes('_Poor')) {
    result.class = 'Poor';
  } else if (fileType.includes('_Moderate')) {
    result.class = 'Moderate';
  } else if (fileType.includes('_Hazardous')) {
    result.class = 'Hazardous';
  }
  
  return result;
};

const getPlotType = (fileType: string): 'pdp' | 'ice' | 'other' => {
  if (fileType.toLowerCase().startsWith('pdp')) return 'pdp';
  if (fileType.toLowerCase().startsWith('ice')) return 'ice';
  return 'other';
};

const ModelInterpretabilityPlots: React.FC<ModelInterpretabilityPlotsProps> = ({ 
  pdpIceMetadata = [],
  taskType 
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Log the raw metadata for debugging
  console.log('Raw pdpIceMetadata:', pdpIceMetadata);
  
  // Process metadata and ensure proper type handling
  const processedMetadata = useMemo(() => {
    if (!pdpIceMetadata || pdpIceMetadata.length === 0) return [];
    
    return pdpIceMetadata.map(item => {
      // Create a new object to avoid modifying the original
      const processed = { ...item };
      
      // Debug log for individual items
      console.log('Processing metadata item:', JSON.stringify(item, null, 2));
      
      // If class is null but we have file_type, try to extract class from file_type
      if ((processed.class === null || processed.class === undefined) && processed.file_type) {
        const extracted = extractFeatureAndClass(processed.file_type);
        if (extracted.class) {
          processed.class = extracted.class;
          console.log(`Extracted class "${processed.class}" from file_type: ${processed.file_type}`);
        }
      }
      
      // Same for feature
      if ((processed.feature === null || processed.feature === undefined) && processed.file_type) {
        const extracted = extractFeatureAndClass(processed.file_type);
        if (extracted.feature) {
          processed.feature = extracted.feature;
          console.log(`Extracted feature "${processed.feature}" from file_type: ${processed.file_type}`);
        }
      }
      
      return processed;
    });
  }, [pdpIceMetadata]);
  
  // Debug log for processed data
  console.log('Processed metadata:', processedMetadata);
  
  // Group plots by type
  const { pdpPlots, icePlots, allPlots } = useMemo(() => {
    // Initialize with empty arrays
    const pdp: PdpIceMetadataItem[] = [];
    const ice: PdpIceMetadataItem[] = [];
    const all: PdpIceMetadataItem[] = [];
    
    processedMetadata.forEach(item => {
      const plotType = getPlotType(item.file_type);
      
      all.push(item);
      
      if (plotType === 'pdp') {
        pdp.push(item);
      } else if (plotType === 'ice') {
        ice.push(item);
      }
    });
    
    console.log(`Grouped plots - PDP: ${pdp.length}, ICE: ${ice.length}, All: ${all.length}`);
    
    return {
      pdpPlots: pdp,
      icePlots: ice,
      allPlots: all
    };
  }, [processedMetadata]);
  
  // No plots available
  if (!pdpIceMetadata || pdpIceMetadata.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Model Interpretability</CardTitle>
          <CardDescription>
            Partial Dependence Plots (PDP) and Individual Conditional Expectation (ICE) plots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No interpretability plots available</AlertTitle>
            <AlertDescription>
              The model doesn't have any PDP or ICE plots available.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Determine if we should show all tabs or just specific ones
  const showPdpTab = pdpPlots.length > 0;
  const showIceTab = icePlots.length > 0;
  
  // Determine which plots to show based on active tab
  const plotsToShow = 
    activeTab === 'pdp' ? pdpPlots :
    activeTab === 'ice' ? icePlots :
    allPlots;
    
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          Model Interpretability
          <span className="ml-auto text-xs text-muted-foreground">
            {allPlots.length} plot{allPlots.length !== 1 ? 's' : ''}
          </span>
        </CardTitle>
        <CardDescription>
          Partial Dependence Plots (PDP) and Individual Conditional Expectation (ICE) plots
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Plots</TabsTrigger>
            {showPdpTab && <TabsTrigger value="pdp">PDP</TabsTrigger>}
            {showIceTab && <TabsTrigger value="ice">ICE</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            {renderPlotTable(allPlots)}
          </TabsContent>
          
          <TabsContent value="pdp" className="mt-4">
            {renderPlotTable(pdpPlots)}
          </TabsContent>
          
          <TabsContent value="ice" className="mt-4">
            {renderPlotTable(icePlots)}
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p className="flex items-center">
            <Info className="h-4 w-4 mr-1" />
            <span>
              <strong>PDP plots</strong> show the marginal effect of a feature on the predicted outcome.
              <strong>ICE plots</strong> show how the prediction changes for individual instances.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
  
  // Helper function to render plot table
  function renderPlotTable(plots: PdpIceMetadataItem[]) {
    if (!plots.length) {
      return (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No plots available</AlertTitle>
          <AlertDescription>
            No plots are available for this category.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Feature</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plots.map((plot, index) => {
              // Log each plot's class value for debugging
              console.log(`Plot ${index} class value:`, {
                class: plot.class,
                typeOfClass: typeof plot.class,
                isNull: plot.class === null,
                isUndefined: plot.class === undefined,
                isEmptyString: plot.class === '',
                displayValue: typeof plot.class === 'string' ? plot.class : (plot.class_id !== undefined ? plot.class_id : '-')
              });
              
              return (
                <TableRow key={index}>
                  <TableCell>
                    <Badge variant={getPlotType(plot.file_type) === 'pdp' ? 'default' : 'secondary'}>
                      {formatFileType(plot.file_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>{plot.feature || '-'}</TableCell>
                  <TableCell>
                    {typeof plot.class === 'string' 
                      ? plot.class 
                      : typeof plot.class === 'number' && !isNaN(plot.class)
                      ? plot.class
                      : plot.class_id !== undefined
                      ? plot.class_id
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <a 
                        href={plot.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        download={`${plot.file_type}.png`}
                      >
                        View
                      </a>
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">Preview</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <div className="aspect-video relative">
                          <img
                            src={plot.file_url}
                            alt={`${getPlotType(plot.file_type)} plot for ${plot.feature || ''} ${plot.class || ''}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div>
                            <Badge variant={getPlotType(plot.file_type) === 'pdp' ? 'default' : 'secondary'}>
                              {formatFileType(plot.file_type)}
                            </Badge>
                            {plot.feature && <span className="ml-2 font-medium">{plot.feature}</span>}
                            {plot.class && (
                              <span className="ml-2 text-muted-foreground">
                                Class: {plot.class}
                              </span>
                            )}
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a 
                              href={plot.file_url} 
                              download={`${plot.file_type}.png`}
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              Download
                            </a>
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }
};

export default ModelInterpretabilityPlots;
