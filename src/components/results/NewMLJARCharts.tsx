
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadFile } from '@/components/training/prediction/utils/downloadUtils';

interface ChartFile {
  file_type: string;
  file_url: string;
  created_at: string;
  curve_subtype?: string;
}

interface NewMLJARChartsProps {
  files: ChartFile[];
}

const getChartTitle = (file: ChartFile): string => {
  const { file_type, curve_subtype } = file;
  
  if (file_type === 'confusion_matrix') {
    // Check filename for "normalized" to distinguish types
    const isNormalized = file.file_url.toLowerCase().includes('normalized');
    return isNormalized ? 'Normalized Confusion Matrix' : 'Confusion Matrix';
  }
  
  if (file_type === 'evaluation_curve') {
    if (curve_subtype === 'roc') {
      return 'ROC Curve';
    }
    if (curve_subtype === 'precision_recall') {
      return 'Precision-Recall Curve';
    }
    return 'Evaluation Curve';
  }
  
  if (file_type === 'learning_curve') {
    return 'Learning Curve';
  }
  
  // Fallback to formatted file_type
  return file_type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const NewMLJARCharts: React.FC<NewMLJARChartsProps> = ({ files }) => {
  console.log('[NewMLJARCharts] Processing files:', files);
  
  // Filter for visualization files (PNG images)
  const visualizationFiles = files.filter(file => {
    const isVisualization = (
      file.file_type === 'confusion_matrix' ||
      file.file_type === 'evaluation_curve' ||
      file.file_type === 'learning_curve'
    );
    
    console.log(`[NewMLJARCharts] File ${file.file_type} (${file.curve_subtype || 'no subtype'}): ${isVisualization ? 'INCLUDED' : 'EXCLUDED'}`);
    
    return isVisualization;
  });
  
  console.log(`[NewMLJARCharts] Found ${visualizationFiles.length} visualization files:`, 
    visualizationFiles.map(f => ({ type: f.file_type, subtype: f.curve_subtype }))
  );
  
  if (visualizationFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No charts available</p>
        <p className="text-xs text-muted-foreground mt-2">
          Expected: confusion_matrix, evaluation_curve, learning_curve files
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {visualizationFiles.map((file, index) => {
        const title = getChartTitle(file);
        
        return (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Dialog>
                <DialogTrigger asChild>
                  <div className="cursor-pointer hover:opacity-90 transition-opacity">
                    <img 
                      src={file.file_url} 
                      alt={title}
                      className="w-full h-auto rounded-md border"
                      style={{ maxHeight: '200px', objectFit: 'contain' }}
                    />
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <div className="p-1">
                    <img 
                      src={file.file_url} 
                      alt={title}
                      className="w-full h-auto rounded-md"
                    />
                    <div className="mt-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{title}</h3>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(file.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => downloadFile(file.file_url, `${title.toLowerCase().replace(/\s+/g, '_')}.png`)}
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
                  onClick={() => downloadFile(file.file_url, `${title.toLowerCase().replace(/\s+/g, '_')}.png`)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default NewMLJARCharts;
