
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, FileText, Link as LinkIcon } from 'lucide-react';

interface PlotMetadata {
  plot_type: string;
  feature: string;
  class_id: number;
  file?: string;
  file_url: string;
  related_feature_importance?: string;
}

interface ModelInterpretabilityPlotsProps {
  files: any[];
}

const ModelInterpretabilityPlots: React.FC<ModelInterpretabilityPlotsProps> = ({ files }) => {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pdp');

  // Enhanced extraction of PDP, ICE plots and their metadata
  const plotsData = useMemo(() => {
    // Extract feature information from file_type names
    const extractMetadata = (file: any): PlotMetadata | null => {
      // For files that already have metadata from the backend
      if (file.feature && file.class_id !== undefined && file.plot_type) {
        return {
          plot_type: file.plot_type,
          feature: file.feature,
          class_id: file.class_id,
          file_url: file.file_url,
          related_feature_importance: file.related_feature_importance
        };
      }

      // For files that need metadata extraction from file_type
      const fileType = file.file_type || '';
      
      // Handle PDP plots (format: pdp_FeatureName_ClassID)
      if (fileType.startsWith('pdp_')) {
        const parts = fileType.split('_');
        if (parts.length >= 3) {
          return {
            plot_type: 'pdp',
            feature: parts[1],
            class_id: parseInt(parts[2], 10),
            file: fileType,
            file_url: file.file_url
          };
        }
      }
      
      // Handle ICE plots (format: ice_FeatureName_ClassID)
      if (fileType.startsWith('ice_')) {
        const parts = fileType.split('_');
        if (parts.length >= 3) {
          return {
            plot_type: 'ice',
            feature: parts[1],
            class_id: parseInt(parts[2], 10),
            file: fileType,
            file_url: file.file_url
          };
        }
      }
      
      return null;
    };
    
    // Extract metadata from all files
    const allMetadata = files
      .map(extractMetadata)
      .filter(Boolean) as PlotMetadata[];
    
    // Split by plot type
    const pdpPlots = allMetadata.filter(plot => plot.plot_type === 'pdp');
    const icePlots = allMetadata.filter(plot => plot.plot_type === 'ice');
    
    // Get unique features across both plot types
    const allFeatures = [...pdpPlots, ...icePlots]
      .map(plot => plot.feature)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    
    // Find feature importance plot
    const featureImportancePlot = files.find(file => 
      file.file_type?.includes('importance') || 
      file.file_type?.includes('variable_importance')
    );
    
    // Link PDP/ICE plots to feature importance if available
    if (featureImportancePlot) {
      [...pdpPlots, ...icePlots].forEach(plot => {
        plot.related_feature_importance = featureImportancePlot.file_url;
      });
    }
    
    return {
      pdpPlots,
      icePlots,
      features: allFeatures,
      featureImportancePlot
    };
  }, [files]);

  // Set initial active feature if available
  React.useEffect(() => {
    if (plotsData.features.length > 0 && !activeFeature) {
      setActiveFeature(plotsData.features[0]);
    }
  }, [plotsData.features, activeFeature]);

  // Get plots for current active feature and tab
  const currentPlots = useMemo(() => {
    if (!activeFeature) return [];
    
    if (activeTab === 'pdp') {
      return plotsData.pdpPlots.filter(plot => plot.feature === activeFeature);
    } else {
      return plotsData.icePlots.filter(plot => plot.feature === activeFeature);
    }
  }, [activeFeature, activeTab, plotsData]);

  if (plotsData.features.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Model Interpretability</CardTitle>
          <CardDescription>
            No PDP or ICE plots are available for this model
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No interpretability plots available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Model Interpretability
        </CardTitle>
        <CardDescription>
          Examine how features affect predictions across different classes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Feature Selection */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <h3 className="text-sm font-medium mb-2">Features</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                {plotsData.features.map(feature => (
                  <Button
                    key={feature}
                    variant={activeFeature === feature ? "secondary" : "ghost"}
                    className="justify-start w-full text-left h-auto py-1.5 px-2"
                    onClick={() => setActiveFeature(feature)}
                  >
                    {feature}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-9">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-between items-center mb-2">
                  <TabsList className="w-auto">
                    <TabsTrigger value="pdp" className="text-xs">
                      Partial Dependence Plots
                    </TabsTrigger>
                    <TabsTrigger value="ice" className="text-xs">
                      ICE Plots
                    </TabsTrigger>
                  </TabsList>
                  
                  {plotsData.featureImportancePlot && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs">
                          <LinkIcon className="h-3.5 w-3.5 mr-1" />
                          View Feature Importance
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <div className="p-1">
                          <img 
                            src={plotsData.featureImportancePlot.file_url} 
                            alt="Feature Importance" 
                            className="w-full rounded-md"
                          />
                          <div className="mt-4 flex justify-end">
                            <Button variant="outline" size="sm" asChild>
                              <a 
                                href={plotsData.featureImportancePlot.file_url}
                                download={`feature_importance.png`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </a>
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                
                <TabsContent value="pdp" className="mt-0">
                  <Card>
                    <CardHeader className="px-4 py-3">
                      <CardTitle className="text-base">
                        {activeFeature && `PDP for ${activeFeature}`}
                      </CardTitle>
                      <CardDescription>
                        How {activeFeature} impacts predictions across classes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      {currentPlots.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentPlots.map((plot, idx) => (
                            <Dialog key={idx}>
                              <DialogTrigger asChild>
                                <Card className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden">
                                  <CardContent className="p-3">
                                    <div className="aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center relative">
                                      <img 
                                        src={plot.file_url} 
                                        alt={`${plot.feature} Class ${plot.class_id}`}
                                        className="w-full h-full object-contain"
                                      />
                                      <div className="absolute bottom-2 right-2">
                                        <Badge className="bg-primary">Class {plot.class_id}</Badge>
                                      </div>
                                      <div className="absolute top-2 right-2">
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full">
                                          <ZoomIn className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <div className="p-1">
                                  <img 
                                    src={plot.file_url} 
                                    alt={`${plot.feature} Class ${plot.class_id}`} 
                                    className="w-full rounded-md"
                                  />
                                  <div className="mt-4 flex justify-between items-center">
                                    <div>
                                      <h3 className="text-lg font-medium">
                                        {plot.feature} - Class {plot.class_id}
                                      </h3>
                                      <p className="text-sm text-muted-foreground">
                                        Partial Dependence Plot
                                      </p>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                      <a 
                                        href={plot.file_url}
                                        download={`pdp_${plot.feature}_class_${plot.class_id}.png`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">
                            No PDP plots available for {activeFeature}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="ice" className="mt-0">
                  <Card>
                    <CardHeader className="px-4 py-3">
                      <CardTitle className="text-base">
                        {activeFeature && `ICE for ${activeFeature}`}
                      </CardTitle>
                      <CardDescription>
                        Individual Conditional Expectation plots for {activeFeature}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      {currentPlots.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentPlots.map((plot, idx) => (
                            <Dialog key={idx}>
                              <DialogTrigger asChild>
                                <Card className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden">
                                  <CardContent className="p-3">
                                    <div className="aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center relative">
                                      <img 
                                        src={plot.file_url} 
                                        alt={`${plot.feature} Class ${plot.class_id}`}
                                        className="w-full h-full object-contain" 
                                      />
                                      <div className="absolute bottom-2 right-2">
                                        <Badge className="bg-primary">Class {plot.class_id}</Badge>
                                      </div>
                                      <div className="absolute top-2 right-2">
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full">
                                          <ZoomIn className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <div className="p-1">
                                  <img 
                                    src={plot.file_url} 
                                    alt={`${plot.feature} Class ${plot.class_id}`} 
                                    className="w-full rounded-md"
                                  />
                                  <div className="mt-4 flex justify-between items-center">
                                    <div>
                                      <h3 className="text-lg font-medium">
                                        {plot.feature} - Class {plot.class_id}
                                      </h3>
                                      <p className="text-sm text-muted-foreground">
                                        Individual Conditional Expectation Plot
                                      </p>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                      <a 
                                        href={plot.file_url}
                                        download={`ice_${plot.feature}_class_${plot.class_id}.png`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">
                            No ICE plots available for {activeFeature}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          {/* Plot Metadata Table */}
          <Card className="mt-6">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Interpretability Plots Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Feature</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...plotsData.pdpPlots, ...plotsData.icePlots]
                      .sort((a, b) => {
                        // Sort first by feature
                        if (a.feature < b.feature) return -1;
                        if (a.feature > b.feature) return 1;
                        
                        // Then by plot type
                        if (a.plot_type < b.plot_type) return -1;
                        if (a.plot_type > b.plot_type) return 1;
                        
                        // Then by class_id
                        return a.class_id - b.class_id;
                      })
                      .map((plot, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Badge variant="outline">
                              {plot.plot_type === 'pdp' ? 'PDP' : 'ICE'}
                            </Badge>
                          </TableCell>
                          <TableCell>{plot.feature}</TableCell>
                          <TableCell>{plot.class_id}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <a 
                                href={plot.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ZoomIn className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <a 
                                href={plot.file_url}
                                download
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelInterpretabilityPlots;
