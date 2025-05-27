
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

  // Helper function to find specific chart types using metadata
  const findChartByType = (fileType: string, curveSubtype?: string): TrainingFile | undefined => {
    return files.find(file => {
      if (file.file_type !== fileType) return false;
      if (curveSubtype && file.curve_subtype !== curveSubtype) return false;
      return true;
    });
  };

  // Get specific chart types using metadata
  const confusionMatrix = findChartByType('confusion_matrix');
  const normalizedConfusionMatrix = files.find(file => 
    file.file_type === 'confusion_matrix' && 
    (file.file_url?.toLowerCase().includes('normalized') || file.file_type.includes('normalized'))
  );
  const rocCurve = findChartByType('evaluation_curve', 'roc');
  const precisionRecallCurve = findChartByType('evaluation_curve', 'precision_recall');
  const learningCurve = findChartByType('learning_curve');

  // Collect all available charts with their labels
  const availableCharts = [
    { file: confusionMatrix, title: 'Confusion Matrix', fallbackMessage: 'Confusion Matrix not available' },
    { file: normalizedConfusionMatrix, title: 'Normalized Confusion Matrix', fallbackMessage: 'Normalized Confusion Matrix not available' },
    { file: rocCurve, title: 'ROC Curve', fallbackMessage: 'ROC Curve not available' },
    { file: precisionRecallCurve, title: 'Precision-Recall Curve', fallbackMessage: 'Precision-Recall Curve not available' },
    { file: learningCurve, title: 'Learning Curve', fallbackMessage: 'Learning Curve not available' }
  ].filter(chart => chart.file); // Only include charts that were found

  // Debug the found charts
  useEffect(() => {
    console.log('MLJARVisualizations - Found Charts:', {
      confusionMatrix: !!confusionMatrix,
      normalizedConfusionMatrix: !!normalizedConfusionMatrix,
      rocCurve: !!rocCurve,
      precisionRecallCurve: !!precisionRecallCurve,
      learningCurve: !!learningCurve,
      totalAvailable: availableCharts.length
    });
  }, [availableCharts.length, confusionMatrix, normalizedConfusionMatrix, rocCurve, precisionRecallCurve, learningCurve]);

  // Handle image download
  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'chart.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (availableCharts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No visualization charts available</p>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Expected chart types:</p>
          <ul className="list-disc list-inside mt-2">
            <li>Confusion Matrix not available</li>
            <li>ROC Curve not available</li>
            <li>Precision-Recall Curve not available</li>
            <li>Learning Curve not available</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableCharts.map((chart, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {chart.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Dialog>
                <DialogTrigger asChild>
                  <div className="cursor-pointer hover:opacity-90 transition-opacity">
                    <img 
                      src={chart.file!.file_url} 
                      alt={chart.title} 
                      className="w-full h-auto rounded-md object-contain"
                      style={{ maxHeight: "240px" }}
                    />
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <div className="p-2">
                    <img 
                      src={chart.file!.file_url} 
                      alt={chart.title} 
                      className="w-full rounded-md"
                    />
                    <div className="mt-4 flex justify-between items-center">
                      <h3 className="font-medium">{chart.title}</h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownload(
                          chart.file!.file_url, 
                          `${chart.title.toLowerCase().replace(/\s+/g, '_')}.png`
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
                    chart.file!.file_url, 
                    `${chart.title.toLowerCase().replace(/\s+/g, '_')}.png`
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
  );
};

export default MLJARVisualizations;
