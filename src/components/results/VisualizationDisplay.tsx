
import React from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExperimentResults } from '@/types/training';
import { Download, ImageIcon } from 'lucide-react';

interface VisualizationDisplayProps {
  results: ExperimentResults;
}

const VisualizationDisplay: React.FC<VisualizationDisplayProps> = ({ results }) => {
  const files = results?.files || [];
  
  // Filter files to only include visualizations - updated to include importance and evaluation_curve
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
      'class_distribution',
      'variable_importance'
    ];
    return visualTypes.some(type => file.file_type.toLowerCase().includes(type));
  });

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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {visualizationFiles.map((file, index) => (
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
                    {file.file_type.replace(/_/g, ' ')}
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
                  {file.file_type.replace(/_/g, ' ')}
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
  );
};

export default VisualizationDisplay;
