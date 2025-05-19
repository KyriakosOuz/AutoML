
import React, { useEffect } from 'react';
import { TrainingFile } from '@/types/training';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface MLJARVisualizationsProps {
  files: TrainingFile[];
}

const MLJARVisualizations: React.FC<MLJARVisualizationsProps> = ({ files }) => {
  // Debug logging to help track file filtering
  useEffect(() => {
    console.log('MLJARVisualizations - All Files:', files);
  }, [files]);

  // Filter only PNG image files for visualization with improved logic
  const visualizationFiles = files.filter(file => {
    // Must have a file_url and be a PNG file
    if (!file.file_url || !file.file_url.toLowerCase().endsWith('.png')) {
      return false;
    }
    
    // Exclude model files, CSV files, and readme files
    if (
      file.file_type?.includes('model') || 
      file.file_url?.toLowerCase().includes('model') ||
      file.file_type?.includes('csv') || 
      file.file_url?.toLowerCase().includes('csv') ||
      file.file_type?.includes('readme') || 
      file.file_url?.toLowerCase().includes('readme') ||
      file.file_type?.includes('metadata') ||
      file.file_url?.toLowerCase().includes('metadata')
    ) {
      return false;
    }
    
    return true;
  });

  // Debug the filtered visualization files
  useEffect(() => {
    console.log('MLJARVisualizations - Filtered Files:', visualizationFiles);
  }, [visualizationFiles]);

  if (visualizationFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No visualization charts available</p>
      </div>
    );
  }

  // Helper function to format file type into a readable title
  const formatFileType = (fileType: string): string => {
    return fileType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Improved chart title determination with more mapping options
  const getChartTitle = (file: TrainingFile): string => {
    // First check curve_subtype for specific curve types
    if (file.curve_subtype) {
      const subtypeMap: Record<string, string> = {
        roc: "ROC Curve",
        precision_recall: "Precision-Recall Curve",
        calibration: "Calibration Curve", 
        lift: "Lift Curve",
        ks: "KS Statistic",
        learning: "Learning Curve"
      };
      
      return subtypeMap[file.curve_subtype] || formatFileType(file.curve_subtype);
    }
    
    // Check for known file_type patterns
    const fileTypeMap: Record<string, string> = {
      confusion_matrix: "Confusion Matrix",
      calibration_curve: "Calibration Curve",
      cumulative_gains: "Cumulative Gains Curve",
      lift_curve: "Lift Curve",
      learning_curve: "Learning Curve",
      ks_statistic: "KS Statistic",
      feature_importance: "Feature Importance"
    };
    
    // Try to match known file types
    for (const [key, value] of Object.entries(fileTypeMap)) {
      if (file.file_type?.toLowerCase().includes(key)) {
        return value;
      }
    }
    
    // Default to formatted file_type
    return formatFileType(file.file_type);
  };

  // Group visualizations by type for better organization
  const groupedVisualizations = visualizationFiles.reduce((groups: Record<string, TrainingFile[]>, file) => {
    const title = getChartTitle(file);
    if (!groups[title]) {
      groups[title] = [];
    }
    groups[title].push(file);
    return groups;
  }, {});

  // Handle image download
  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'chart.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedVisualizations).map(([title, files], groupIndex) => (
        <div key={`group-${groupIndex}`} className="space-y-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file, index) => (
              <Card key={`${groupIndex}-${index}`} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {files.length > 1 ? `${title} ${index + 1}` : title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="cursor-pointer hover:opacity-90 transition-opacity">
                        <img 
                          src={file.file_url} 
                          alt={title} 
                          className="w-full h-auto rounded-md object-contain"
                          style={{ maxHeight: "240px" }}
                        />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <div className="p-2">
                        <img 
                          src={file.file_url} 
                          alt={title} 
                          className="w-full rounded-md"
                        />
                        <div className="mt-4 flex justify-between items-center">
                          <h3 className="font-medium">{title}</h3>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDownload(
                              file.file_url, 
                              `${title.toLowerCase().replace(/\s+/g, '_')}.png`
                            )}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <div className="mt-2 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownload(
                        file.file_url, 
                        `${title.toLowerCase().replace(/\s+/g, '_')}.png`
                      )}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MLJARVisualizations;
