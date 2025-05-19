
import React from 'react';
import { TrainingFile } from '@/types/training';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface MLJARVisualizationsProps {
  files: TrainingFile[];
}

const MLJARVisualizations: React.FC<MLJARVisualizationsProps> = ({ files }) => {
  // Filter only PNG image files for visualization
  const visualizationFiles = files.filter(file => 
    file.file_url.toLowerCase().endsWith('.png') && 
    !file.file_type.includes('model') && 
    !file.file_type.includes('csv') && 
    !file.file_type.includes('readme')
  );

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

  // Determine chart title based on curve_subtype or file_type
  const getChartTitle = (file: TrainingFile): string => {
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
    
    return formatFileType(file.file_type);
  };

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {visualizationFiles.map((file, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{getChartTitle(file)}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Dialog>
              <DialogTrigger asChild>
                <div className="cursor-pointer hover:opacity-90 transition-opacity">
                  <img 
                    src={file.file_url} 
                    alt={getChartTitle(file)} 
                    className="w-full h-auto rounded-md object-contain"
                    style={{ maxHeight: "240px" }}
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <div className="p-2">
                  <img 
                    src={file.file_url} 
                    alt={getChartTitle(file)} 
                    className="w-full rounded-md"
                  />
                  <div className="mt-4 flex justify-between items-center">
                    <h3 className="font-medium">{getChartTitle(file)}</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownload(
                        file.file_url, 
                        `${getChartTitle(file).toLowerCase().replace(/\s+/g, '_')}.png`
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
                  `${getChartTitle(file).toLowerCase().replace(/\s+/g, '_')}.png`
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
  );
};

export default MLJARVisualizations;
