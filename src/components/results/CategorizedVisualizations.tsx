
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { downloadFile } from '@/components/training/prediction/utils/downloadUtils';
import { TrainingFile } from '@/types/training';

interface CategorizedVisualizationsProps {
  visualizationsByType: {
    explainability?: TrainingFile[];
    evaluation?: TrainingFile[];
    confusion_matrix?: TrainingFile[];
    feature_importance?: TrainingFile[];
    model?: TrainingFile[];
    leaderboard?: TrainingFile[];
    [key: string]: TrainingFile[] | undefined;
  };
}

// Helper to format file type names for display
const formatCategoryName = (category: string): string => {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const CategorizedVisualizations: React.FC<CategorizedVisualizationsProps> = ({ visualizationsByType }) => {
  // Filter out empty categories
  const nonEmptyCategories = Object.entries(visualizationsByType)
    .filter(([_, files]) => files && files.length > 0)
    .map(([category]) => category);

  if (nonEmptyCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Model Visualizations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No visualizations available for this model.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Model Visualizations</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={nonEmptyCategories[0]} className="w-full">
          <TabsList className="mb-4">
            {nonEmptyCategories.map(category => (
              <TabsTrigger key={category} value={category}>
                {formatCategoryName(category)}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {nonEmptyCategories.map(category => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visualizationsByType[category]?.map((file, idx) => (
                  <Card key={idx} className="overflow-hidden hover:shadow-md transition-shadow">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="cursor-pointer">
                          <div className="aspect-video bg-muted/20 flex items-center justify-center relative overflow-hidden">
                            <img 
                              src={file.file_url} 
                              alt={file.file_type || 'Visualization'} 
                              className="object-contain w-full h-full p-2"
                            />
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-sm truncate">
                              {file.file_name || formatFileType(file.file_type)}
                            </h4>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <div>
                          <h3 className="text-lg font-medium mb-2">
                            {file.file_name || formatFileType(file.file_type)}
                          </h3>
                          <div className="mt-2 rounded-lg overflow-hidden border border-border">
                            <img 
                              src={file.file_url} 
                              alt={file.file_type || 'Visualization'} 
                              className="w-full h-auto" 
                            />
                          </div>
                          <div className="mt-4 flex justify-end">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => downloadFile(
                                file.file_url, 
                                file.file_name || `${file.file_type.replace(/\s+/g, '_')}.png`
                              )}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Helper to format file type to a more readable name
const formatFileType = (fileType: string): string => {
  if (!fileType) return 'Visualization';
  
  const parts = fileType.split('_');
  return parts
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default CategorizedVisualizations;
