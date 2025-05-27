
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
    console.log('MLJARVisualizations - File Details:', files.map(f => ({
      file_type: f.file_type,
      curve_subtype: f.curve_subtype,
      url: f.file_url?.split('/').pop()
    })));
  }, [files]);

  // Helper function to find specific chart types using metadata
  const findChartByType = (fileType: string, curveSubtype?: string): TrainingFile | undefined => {
    const result = files.find(file => {
      if (file.file_type !== fileType) return false;
      if (curveSubtype && file.curve_subtype !== curveSubtype) return false;
      return true;
    });
    console.log(`Finding ${fileType}${curveSubtype ? ` with subtype ${curveSubtype}` : ''}:`, !!result);
    return result;
  };

  // Get specific chart types using the new metadata structure
  const confusionMatrix = files.find(file => 
    file.file_type === 'confusion_matrix' && 
    !file.file_url?.toLowerCase().includes('normalized')
  );
  
  const normalizedConfusionMatrix = files.find(file => 
    file.file_type === 'confusion_matrix' && 
    file.file_url?.toLowerCase().includes('normalized')
  );
  
  const rocCurve = findChartByType('evaluation_curve', 'roc');
  const precisionRecallCurve = findChartByType('evaluation_curve', 'precision_recall');
  const learningCurve = findChartByType('learning_curve', 'learning');

  // Collect all available charts with their labels
  const availableCharts = [
    { file: confusionMatrix, title: 'Confusion Matrix' },
    { file: normalizedConfusionMatrix, title: 'Normalized Confusion Matrix' },
    { file: rocCurve, title: 'ROC Curve' },
    { file: precisionRecallCurve, title: 'Precision-Recall Curve' },
    { file: learningCurve, title: 'Learning Curve' }
  ].filter(chart => chart.file); // Only include charts that were found

  // Debug the found charts
  useEffect(() => {
    console.log('MLJARVisualizations - Chart Detection Results:', {
      confusionMatrix: !!confusionMatrix,
      normalizedConfusionMatrix: !!normalizedConfusionMatrix,
      rocCurve: !!rocCurve,
      precisionRecallCurve: !!precisionRecallCurve,
      learningCurve: !!learningCurve,
      totalAvailable: availableCharts.length,
      expectedTotal: 5
    });
    
    // Log any visualization files that might have been missed
    const allVisualizationFiles = files.filter(file => 
      file.file_url?.toLowerCase().endsWith('.png')
    );
    console.log('MLJARVisualizations - All PNG files:', allVisualizationFiles.map(f => ({
      type: f.file_type,
      subtype: f.curve_subtype,
      filename: f.file_url?.split('/').pop()
    })));
  }, [availableCharts.length, confusionMatrix, normalizedConfusionMatrix, rocCurve, precisionRecallCurve, learningCurve, files]);

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
          <p>Debug Info:</p>
          <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
            <li>Total files: {files.length}</li>
            <li>PNG files: {files.filter(f => f.file_url?.endsWith('.png')).length}</li>
            <li>Confusion matrix files: {files.filter(f => f.file_type === 'confusion_matrix').length}</li>
            <li>Evaluation curve files: {files.filter(f => f.file_type === 'evaluation_curve').length}</li>
            <li>Learning curve files: {files.filter(f => f.file_type === 'learning_curve').length}</li>
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
      
      {/* Debug information panel */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg text-sm">
        <h4 className="font-medium mb-2">Debug Information:</h4>
        <p>Found {availableCharts.length} out of 5 expected charts</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <span>Confusion Matrix: {confusionMatrix ? '✓' : '✗'}</span>
          <span>Normalized CM: {normalizedConfusionMatrix ? '✓' : '✗'}</span>
          <span>ROC Curve: {rocCurve ? '✓' : '✗'}</span>
          <span>PR Curve: {precisionRecallCurve ? '✓' : '✗'}</span>
          <span>Learning Curve: {learningCurve ? '✓' : '✗'}</span>
        </div>
      </div>
    </div>
  );
};

export default MLJARVisualizations;
