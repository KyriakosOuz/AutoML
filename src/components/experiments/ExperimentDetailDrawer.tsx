import React, { useEffect, useState, useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, ExternalLink, File, FileText, HelpCircle, ImagePlus, Plus, Upload, UploadCloud, User } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ExperimentResults } from "@/types/training"

interface ExperimentDetailDrawerProps {
  results: ExperimentResults | null;
  onClose: () => void;
}

interface VisualizationFile {
  file_url: string;
  file_type: string;
  file_name?: string;
}

const ExperimentDetailDrawer: React.FC<ExperimentDetailDrawerProps> = ({ results, onClose }) => {
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);

  // Get visualizations for the Charts & Plots section
  const getVisualizationFiles = (): VisualizationFile[] => {
    if (!results || !results.files) return [];
    
    // Filter files to only include visualization types and exclude model/CSV files
    const visualTypes = [
      'confusion_matrix', 'evaluation_curve', 'roc_curve', 
      'precision_recall', 'feature_importance', 'learning_curve', 
      'shap', 'partial_dependence', 'ice', 'pdp', 'residuals', 'calibration'
    ];
    
    const excludeTypes = [
      'model', 'trained_model', 'leaderboard_csv', 'predictions_csv', 'csv'
    ];
    
    // Check if the results have visualizations_by_type field for better categorization
    if (results.visualizations_by_type && typeof results.visualizations_by_type === 'object') {
      // Flatten the visualization types from the backend categorization
      // But exclude model and CSV files
      return Object.entries(results.visualizations_by_type)
        .filter(([category]) => category !== 'model' && category !== 'leaderboard' && category !== 'predictions')
        .flatMap(([_, files]) => files)
        .map(file => ({
          file_url: file.file_url,
          file_type: file.file_type || 'visualization',
          file_name: file.file_name
        }));
    }
    
    // Fallback to the traditional filtering
    return (results.files || [])
      .filter(file => {
        // Check if file type matches any visualization type
        const isVisualization = visualTypes.some(type => 
          file.file_type?.toLowerCase().includes(type)
        );
        
        // Make sure it's not a model or CSV file
        const isExcluded = excludeTypes.some(type => 
          file.file_type?.toLowerCase().includes(type) || 
          file.file_name?.toLowerCase().includes(type)
        );
        
        return isVisualization && !isExcluded;
      })
      .map(file => ({
        file_url: file.file_url,
        file_type: file.file_type || 'visualization',
        file_name: file.file_name
      }));
  };

  const visualizationFiles = useMemo(() => getVisualizationFiles(), [results]);
  
  // Add state for visualization filtering
  const [visualizationFilter, setVisualizationFilter] = useState<string>("all");
  
  // Filter visualizations based on the selected filter
  const filteredVisualizations = useMemo(() => {
    if (visualizationFilter === "all") return visualizationFiles;
    
    if (visualizationFilter === "pdp") {
      return visualizationFiles.filter(file => 
        file.file_type.toLowerCase().includes('pdp') || 
        file.file_type.toLowerCase().includes('partial_dependence')
      );
    }
    
    if (visualizationFilter === "ice") {
      return visualizationFiles.filter(file => 
        file.file_type.toLowerCase().includes('ice')
      );
    }
    
    if (visualizationFilter === "importance") {
      return visualizationFiles.filter(file => 
        file.file_type.toLowerCase().includes('importance') || 
        file.file_type.toLowerCase().includes('variable_importance')
      );
    }
    
    if (visualizationFilter === "other") {
      return visualizationFiles.filter(file => 
        !file.file_type.toLowerCase().includes('pdp') && 
        !file.file_type.toLowerCase().includes('partial_dependence') &&
        !file.file_type.toLowerCase().includes('ice') &&
        !file.file_type.toLowerCase().includes('importance') &&
        !file.file_type.toLowerCase().includes('variable_importance')
      );
    }
    
    return visualizationFiles;
  }, [visualizationFiles, visualizationFilter]);
  
  // Calculate counts for the filter buttons
  const visualizationCounts = useMemo(() => {
    const pdpCount = visualizationFiles.filter(file => 
      file.file_type.toLowerCase().includes('pdp') || 
      file.file_type.toLowerCase().includes('partial_dependence')
    ).length;
    
    const iceCount = visualizationFiles.filter(file => 
      file.file_type.toLowerCase().includes('ice')
    ).length;
    
    const importanceCount = visualizationFiles.filter(file => 
      file.file_type.toLowerCase().includes('importance') || 
      file.file_type.toLowerCase().includes('variable_importance')
    ).length;
    
    const otherCount = visualizationFiles.filter(file => 
      !file.file_type.toLowerCase().includes('pdp') && 
      !file.file_type.toLowerCase().includes('partial_dependence') &&
      !file.file_type.toLowerCase().includes('ice') &&
      !file.file_type.toLowerCase().includes('importance') &&
      !file.file_type.toLowerCase().includes('variable_importance')
    ).length;
    
    return {
      all: visualizationFiles.length,
      pdp: pdpCount,
      ice: iceCount,
      importance: importanceCount,
      other: otherCount
    };
  }, [visualizationFiles]);

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Experiment Details</h2>

        {/* Model Information */}
        <div className="mb-4">
          <h3 className="text-base font-medium mb-2">Model Information</h3>
          <p><strong>Model Name:</strong> {results?.model_display_name || 'N/A'}</p>
          <p><strong>AutoML Engine:</strong> {results?.automl_engine || 'N/A'}</p>
          <p><strong>Task Type:</strong> {results?.task_type || 'N/A'}</p>
          <p><strong>Status:</strong> {results?.status || 'N/A'}</p>
        </div>

        {/* Metrics */}
        <div className="mb-4">
          <h3 className="text-base font-medium mb-2">
            Metrics
            <Button variant="ghost" size="icon" onClick={() => setIsMetricsOpen(!isMetricsOpen)}>
              <HelpCircle className="h-4 w-4" />
            </Button>
          </h3>
          <Accordion type="single" collapsible>
            <AccordionItem value="metrics">
              <AccordionTrigger>View Metrics</AccordionTrigger>
              <AccordionContent>
                {results?.metrics ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(results.metrics).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell>{key}</TableCell>
                          <TableCell>{value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p>No metrics available.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Files */}
        <div className="mb-4">
          <h3 className="text-base font-medium mb-2">
            Files
            <Button variant="ghost" size="icon" onClick={() => setIsFilesOpen(!isFilesOpen)}>
              <HelpCircle className="h-4 w-4" />
            </Button>
          </h3>
          <Accordion type="single" collapsible>
            <AccordionItem value="files">
              <AccordionTrigger>View Files</AccordionTrigger>
              <AccordionContent>
                {results?.files && results.files.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {results.files.map((file, index) => (
                      <li key={index} className="mb-1">
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-500 hover:underline"
                        >
                          <File className="h-4 w-4 mr-2" />
                          {file.file_name || file.file_type}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No files available.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        {visualizationFiles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-base font-medium mb-2">Charts & Plots</h3>
            
            {/* Filtering tabs */}
            <div className="flex space-x-2 mb-3 overflow-x-auto pb-1">
              <Button 
                size="sm" 
                variant={visualizationFilter === "all" ? "secondary" : "outline"}
                onClick={() => setVisualizationFilter("all")}
                className="whitespace-nowrap"
              >
                All ({visualizationCounts.all})
              </Button>
              
              {visualizationCounts.pdp > 0 && (
                <Button 
                  size="sm" 
                  variant={visualizationFilter === "pdp" ? "secondary" : "outline"}
                  onClick={() => setVisualizationFilter("pdp")}
                  className="whitespace-nowrap"
                >
                  PDP Plots ({visualizationCounts.pdp})
                </Button>
              )}
              
              {visualizationCounts.ice > 0 && (
                <Button 
                  size="sm" 
                  variant={visualizationFilter === "ice" ? "secondary" : "outline"}
                  onClick={() => setVisualizationFilter("ice")}
                  className="whitespace-nowrap"
                >
                  ICE Plots ({visualizationCounts.ice})
                </Button>
              )}
              
              {visualizationCounts.importance > 0 && (
                <Button 
                  size="sm" 
                  variant={visualizationFilter === "importance" ? "secondary" : "outline"}
                  onClick={() => setVisualizationFilter("importance")}
                  className="whitespace-nowrap"
                >
                  Importance ({visualizationCounts.importance})
                </Button>
              )}
              
              {visualizationCounts.other > 0 && (
                <Button 
                  size="sm" 
                  variant={visualizationFilter === "other" ? "secondary" : "outline"}
                  onClick={() => setVisualizationFilter("other")}
                  className="whitespace-nowrap"
                >
                  Other ({visualizationCounts.other})
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredVisualizations.map((file, idx) => (
                <Dialog key={idx}>
                  <DialogTrigger asChild>
                    <div className="cursor-pointer border rounded-md hover:border-primary/50 transition-all hover:shadow-md">
                      <div className="aspect-video overflow-hidden rounded-t-md bg-muted">
                        <div 
                          className="h-full bg-contain bg-center bg-no-repeat"
                          style={{ backgroundImage: `url(${file.file_url})` }}
                        ></div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs truncate font-medium">
                          {formatVisualizationName(file.file_type)}
                        </p>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <img 
                      src={file.file_url} 
                      alt={file.file_type} 
                      className="w-full rounded-md"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <h3 className="font-medium capitalize">
                        {formatVisualizationName(file.file_type)}
                      </h3>
                      <Button variant="outline" size="sm" asChild>
                        <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to format visualization names (add to component or outside)
const formatVisualizationName = (fileType: string): string => {
  if (fileType.includes('confusion_matrix')) {
    return fileType.includes('normalized') ? 'Normalized Confusion Matrix' : 'Confusion Matrix';
  } else if (fileType.includes('roc_curve')) {
    return 'ROC Curve';
  } else if (fileType.includes('precision_recall')) {
    return 'Precision-Recall Curve';
  } else if (fileType.includes('feature_importance') || fileType.includes('importance')) {
    return 'Feature Importance';
  } else if (fileType.includes('learning_curve')) {
    return 'Learning Curve';
  } else if (fileType.includes('pdp_')) {
    // Parse PDP plot names to show feature and class
    const parts = fileType.replace('pdp_', '').split('_');
    if (parts.length >= 2) {
      const feature = parts[0];
      const className = parts.slice(1).join(' ');
      return `PDP: ${feature} - ${className}`;
    }
    return 'Partial Dependence Plot';
  } else if (fileType.includes('ice_')) {
    // Parse ICE plot names to show feature and class
    const parts = fileType.replace('ice_', '').split('_');
    if (parts.length >= 2) {
      const feature = parts[0];
      const className = parts.slice(1).join(' ');
      return `ICE: ${feature} - ${className}`;
    }
    return 'Individual Conditional Expectation';
  }
  
  return fileType.replace(/_/g, ' ');
};

export default ExperimentDetailDrawer;
