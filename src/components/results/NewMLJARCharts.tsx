
import React from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DownloadCloud } from 'lucide-react';
import { TrainingFile } from '@/types/training';
import { downloadFile } from '@/components/training/prediction/utils/downloadUtils';

interface NewMLJARChartsProps {
  files: TrainingFile[];
}

const NewMLJARCharts: React.FC<NewMLJARChartsProps> = ({ files }) => {
  // Filter files to only include visualization types
  const visualizationFiles = files.filter(file => {
    const type = file.file_type?.toLowerCase() || '';
    const url = file.file_url?.toLowerCase() || '';
    
    // Include image files that are visualizations
    const isImageFile = url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.svg');
    const isVisualization = type.includes('confusion_matrix') || 
                           type.includes('evaluation_curve') || 
                           type.includes('learning_curve') ||
                           type.includes('distribution') ||
                           type.includes('plot');
    
    return isImageFile && isVisualization;
  });

  console.log('NewMLJARCharts: Filtered visualization files:', visualizationFiles.map(f => ({
    type: f.file_type,
    subtype: f.curve_subtype,
    url: f.file_url
  })));

  // Categorize charts based on file metadata
  const categorizeChart = (file: TrainingFile) => {
    const type = file.file_type?.toLowerCase() || '';
    const subtype = file.curve_subtype?.toLowerCase() || '';
    const url = file.file_url?.toLowerCase() || '';

    if (type.includes('confusion_matrix')) {
      return url.includes('normalized') ? 'Normalized Confusion Matrix' : 'Confusion Matrix';
    }
    
    if (type.includes('evaluation_curve')) {
      if (subtype === 'roc') return 'ROC Curve';
      if (subtype === 'precision_recall') return 'Precision-Recall Curve';
      return 'Evaluation Curve';
    }
    
    if (type.includes('learning_curve')) {
      return 'Learning Curve';
    }
    
    // Fallback to formatted file type
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      await downloadFile(url, filename);
    } catch (error) {
      console.error('Error downloading chart:', error);
    }
  };

  if (visualizationFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-muted-foreground">No visualization charts available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {visualizationFiles.map((file, idx) => {
        const chartTitle = categorizeChart(file);
        const filename = `${chartTitle.toLowerCase().replace(/\s+/g, '_')}.png`;
        
        return (
          <Dialog key={idx}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
                    <img 
                      src={file.file_url} 
                      alt={chartTitle}
                      className="object-contain w-full h-full max-h-[200px]"
                    />
                  </div>
                  <div className="mt-2">
                    <p className="font-medium text-sm">{chartTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(file.created_at).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <div className="p-1">
                <img 
                  src={file.file_url} 
                  alt={chartTitle}
                  className="w-full rounded-md"
                />
                <div className="mt-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{chartTitle}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(file.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDownload(file.file_url, filename)}
                  >
                    <DownloadCloud className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })}
    </div>
  );
};

export default NewMLJARCharts;
