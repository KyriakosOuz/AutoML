
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExperimentResults } from '@/types/training';
import { Download, ImageIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VisualizationDisplayProps {
  results: ExperimentResults;
}

const VisualizationDisplay: React.FC<VisualizationDisplayProps> = ({ results }) => {
  const files = results?.files || [];
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Enhanced filtering to capture ALL visualization types, now including pdp plots
  // and excluding model/CSV files
  const visualizationFiles = files.filter(file => {
    const visualTypes = [
      'distribution', 
      'shap', 
      'confusion_matrix', 
      'importance', 
      'evaluation_curve',
      'plot', 
      'chart', 
      'graph', 
      'visualization',
      'roc_curve',
      'precision_recall_curve',
      'precision_recall',
      'class_distribution',
      'variable_importance',
      'learning_curve',
      'true_vs_predicted',
      'predicted_vs_residuals',
      'residual_analysis',
      'pdp', // Add PDP plots
      'ice', // Add ICE plots
      'partial_dependence' // Alternative naming for PDP
    ];
    
    // Exclude model and CSV files
    const excludeTypes = [
      'model', 'trained_model', 'leaderboard_csv', 'predictions_csv', 'csv'
    ];
    
    const isVisualization = visualTypes.some(type => file.file_type.toLowerCase().includes(type));
    const isExcluded = excludeTypes.some(type => 
      file.file_type.toLowerCase().includes(type) || 
      (file.file_name && file.file_name.toLowerCase().includes(type))
    );
    
    return isVisualization && !isExcluded;
  });

  // Log which visualizations were found
  console.log("[VisualizationDisplay] Found visualization files:", 
    visualizationFiles.map(f => ({ type: f.file_type, url: f.file_url }))
  );
  
  // Create categorized visualizations for filtering
  const pdpPlots = visualizationFiles.filter(file => 
    file.file_type.toLowerCase().includes('pdp') || 
    file.file_type.toLowerCase().includes('partial_dependence')
  );
  
  const icePlots = visualizationFiles.filter(file => 
    file.file_type.toLowerCase().includes('ice')
  );
  
  const importancePlots = visualizationFiles.filter(file => 
    file.file_type.toLowerCase().includes('importance') || 
    file.file_type.toLowerCase().includes('variable_importance')
  );
  
  const otherPlots = visualizationFiles.filter(file => 
    !file.file_type.toLowerCase().includes('pdp') && 
    !file.file_type.toLowerCase().includes('partial_dependence') &&
    !file.file_type.toLowerCase().includes('ice') &&
    !file.file_type.toLowerCase().includes('importance') &&
    !file.file_type.toLowerCase().includes('variable_importance')
  );

  // Function to get currently filtered visualizations based on active tab
  const getFilteredVisualizations = () => {
    switch (activeTab) {
      case 'pdp':
        return pdpPlots;
      case 'ice':
        return icePlots;
      case 'importance':
        return importancePlots;
      case 'other':
        return otherPlots;
      case 'all':
      default:
        return visualizationFiles;
    }
  };
  
  const filteredVisualizations = getFilteredVisualizations();
  
  // Calculate counts for tab labels
  const counts = {
    all: visualizationFiles.length,
    pdp: pdpPlots.length,
    ice: icePlots.length, 
    importance: importancePlots.length,
    other: otherPlots.length
  };

  if (visualizationFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Visualizations Available</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          No visualizations were found for this experiment.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs for filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="w-full mb-2">
          <TabsTrigger value="all" className="flex-1">
            All ({counts.all})
          </TabsTrigger>
          {counts.pdp > 0 && (
            <TabsTrigger value="pdp" className="flex-1">
              PDP Plots ({counts.pdp})
            </TabsTrigger>
          )}
          {counts.ice > 0 && (
            <TabsTrigger value="ice" className="flex-1">
              ICE Plots ({counts.ice})
            </TabsTrigger>
          )}
          {counts.importance > 0 && (
            <TabsTrigger value="importance" className="flex-1">
              Importance ({counts.importance})
            </TabsTrigger>
          )}
          {counts.other > 0 && (
            <TabsTrigger value="other" className="flex-1">
              Other ({counts.other})
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredVisualizations.map((file, index) => (
          <Dialog key={index}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="aspect-video bg-muted flex items-center justify-center rounded-md relative overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${file.file_url})` }}
                    />
                    <div className="absolute inset-0 bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors" />
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium capitalize">
                      {formatVisualizationName(file.file_type)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <div className="p-1">
                <img 
                  src={file.file_url} 
                  alt={file.file_type} 
                  className="w-full rounded-md"
                />
                <div className="mt-2 flex justify-between items-center">
                  <h3 className="font-medium capitalize">
                    {formatVisualizationName(file.file_type)}
                  </h3>
                  <Button variant="outline" size="sm" asChild>
                    <a href={file.file_url} download={file.file_name || `${file.file_type}.png`} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
};

// Enhanced helper function to format visualization names in a user-friendly way
const formatVisualizationName = (fileType: string): string => {
  if (fileType.includes('confusion_matrix')) {
    return fileType.includes('normalized') ? 'Normalized Confusion Matrix' : 'Confusion Matrix';
  } else if (fileType.includes('roc_curve') || fileType.includes('evaluation_curve')) {
    // Check if this is a precision-recall curve first
    if (fileType.includes('precision_recall')) {
      return 'Precision-Recall Curve';
    }
    return 'ROC Curve';
  } else if (fileType.includes('precision_recall')) {
    return 'Precision-Recall Curve';
  } else if (fileType.includes('learning_curve')) {
    return 'Learning Curve';
  } else if (fileType.includes('feature_importance') || fileType.includes('importance')) {
    return 'Feature Importance';
  } else if (fileType.includes('true_vs_predicted')) {
    return 'True vs Predicted';
  } else if (fileType.includes('predicted_vs_residuals') || fileType.includes('residual_analysis')) {
    return 'Residual Analysis';
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

export default VisualizationDisplay;
