import React, { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Download, ImageIcon } from 'lucide-react';

interface MLJARVisualizationsProps {
  files: Array<{
    file_name?: string;
    file_type?: string;
    file_url: string;
    file_content?: string;
  }>;
}

const MLJARVisualizations: React.FC<MLJARVisualizationsProps> = ({ files }) => {
  const categorizedVisuals = useMemo(() => {
    const result = {
      roc_curves: [] as typeof files,
      precision_recall: [] as typeof files,
      learning_curves: [] as typeof files,
      other: [] as typeof files
    };

    files.forEach(file => {
      // Look at both file_name and file_url for categorization
      const fileNameLower = (file.file_name || '').toLowerCase();
      const fileUrlLower = file.file_url.toLowerCase();

      if (fileNameLower.includes('roc_curve') || fileUrlLower.includes('roc_curve') || fileUrlLower.includes('roc-curve')) {
        result.roc_curves.push(file);
      } else if (
        fileNameLower.includes('precision_recall') || 
        fileUrlLower.includes('precision_recall') || 
        fileUrlLower.includes('precision-recall')
      ) {
        result.precision_recall.push(file);
      } else if (
        fileNameLower.includes('learning_curve') || 
        fileUrlLower.includes('learning_curve') || 
        fileUrlLower.includes('learning-curve') ||
        fileNameLower.includes('learning_curves') || 
        fileUrlLower.includes('learning_curves')
      ) {
        result.learning_curves.push(file);
      } else {
        result.other.push(file);
      }
    });

    console.log("[MLJARVisualizations] Categorized visuals:", {
      roc_curves: result.roc_curves.length,
      precision_recall: result.precision_recall.length,
      learning_curves: result.learning_curves.length,
      other: result.other.length
    });

    return result;
  }, [files]);

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Visualizations Available</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          No MLJAR visualizations were found for this experiment.
        </p>
      </div>
    );
  }

  // If we only have 'other' category with fewer than 5 items, show a grid
  if (
    categorizedVisuals.roc_curves.length === 0 &&
    categorizedVisuals.precision_recall.length === 0 &&
    categorizedVisuals.learning_curves.length === 0 &&
    categorizedVisuals.other.length < 5
  ) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {files.map((file, index) => (
          <VisualizationCard key={index} file={file} />
        ))}
      </div>
    );
  }

  // Otherwise, use tabs for organization
  return (
    <Tabs defaultValue={getDefaultTab(categorizedVisuals)} className="w-full">
      <TabsList className="mb-4">
        {categorizedVisuals.roc_curves.length > 0 && (
          <TabsTrigger value="roc_curves">ROC Curves</TabsTrigger>
        )}
        {categorizedVisuals.precision_recall.length > 0 && (
          <TabsTrigger value="precision_recall">Precision-Recall</TabsTrigger>
        )}
        {categorizedVisuals.learning_curves.length > 0 && (
          <TabsTrigger value="learning_curves">Learning Curves</TabsTrigger>
        )}
        {categorizedVisuals.other.length > 0 && (
          <TabsTrigger value="other">Other Plots</TabsTrigger>
        )}
      </TabsList>

      {categorizedVisuals.roc_curves.length > 0 && (
        <TabsContent value="roc_curves" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categorizedVisuals.roc_curves.map((file, index) => (
              <VisualizationCard key={index} file={file} />
            ))}
          </div>
        </TabsContent>
      )}

      {categorizedVisuals.precision_recall.length > 0 && (
        <TabsContent value="precision_recall" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categorizedVisuals.precision_recall.map((file, index) => (
              <VisualizationCard key={index} file={file} />
            ))}
          </div>
        </TabsContent>
      )}

      {categorizedVisuals.learning_curves.length > 0 && (
        <TabsContent value="learning_curves" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categorizedVisuals.learning_curves.map((file, index) => (
              <VisualizationCard key={index} file={file} />
            ))}
          </div>
        </TabsContent>
      )}

      {categorizedVisuals.other.length > 0 && (
        <TabsContent value="other" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categorizedVisuals.other.map((file, index) => (
              <VisualizationCard key={index} file={file} />
            ))}
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
};

// Helper component for visualizations
const VisualizationCard = ({ file }: { file: MLJARVisualizationsProps['files'][0] }) => {
  // Get a friendly name for the visualization
  const getVisualizationName = () => {
    const fileName = file.file_name || file.file_url.split('/').pop() || '';
    
    if (fileName.includes('learning_curve') || fileName.includes('learning_curves')) {
      return 'Learning Curve';
    }
    if (fileName.includes('roc_curve')) {
      return 'ROC Curve';
    }
    if (fileName.includes('precision_recall')) {
      return 'Precision-Recall Curve';
    }
    
    // Return a cleaned up version of the file name
    return fileName
      .replace(/[_-]/g, ' ')
      .replace(/\.png$/, '')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Dialog>
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
              <p className="text-sm font-medium">{getVisualizationName()}</p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <div className="p-1">
          <img 
            src={file.file_url} 
            alt={getVisualizationName()}
            className="w-full rounded-md"
          />
          <div className="mt-2 flex justify-between items-center">
            <h3 className="font-medium">{getVisualizationName()}</h3>
            <Button variant="outline" size="sm" asChild>
              <a 
                href={file.file_url} 
                download={file.file_name || `${getVisualizationName()}.png`}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to determine default tab
const getDefaultTab = (categorizedVisuals: ReturnType<typeof useMemo<any>>) => {
  if (categorizedVisuals.roc_curves.length > 0) return 'roc_curves';
  if (categorizedVisuals.precision_recall.length > 0) return 'precision_recall';
  if (categorizedVisuals.learning_curves.length > 0) return 'learning_curves';
  return 'other';
};

export default MLJARVisualizations;
