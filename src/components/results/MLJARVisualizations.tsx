
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { downloadCSV } from '@/components/training/prediction/utils/downloadUtils';

interface MLJARVisualizationFile {
  file_name?: string;
  file_type?: string;
  file_url: string;
  predictions?: any[];
}

interface MLJARVisualizationsProps {
  files: MLJARVisualizationFile[];
}

const MLJARVisualizations: React.FC<MLJARVisualizationsProps> = ({ files }) => {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No visualizations available
      </div>
    );
  }

  // Find the predictions file if it exists
  const predictionFile = files.find(file => 
    file.file_type === 'predictions' || 
    file.file_name?.includes('predictions') ||
    file.file_url?.includes('predictions')
  );

  // Handle downloading predictions data
  const handleDownloadPredictions = async () => {
    if (predictionFile?.predictions) {
      // If we already have predictions data in memory
      downloadCSV(predictionFile.predictions, 'mljar_predictions.csv');
    } else if (predictionFile?.file_url) {
      try {
        // Fetch the predictions data from the file URL
        const response = await fetch(predictionFile.file_url);
        const data = await response.json();
        
        // Check if data has predictions array
        const predictionsData = data.predictions || data;
        
        if (Array.isArray(predictionsData)) {
          downloadCSV(predictionsData, 'mljar_predictions.csv');
        } else {
          console.error('Predictions data is not an array:', predictionsData);
        }
      } catch (error) {
        console.error('Failed to fetch predictions data:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {predictionFile && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex justify-between items-center">
              <span>Model Predictions</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadPredictions} 
                className="ml-auto"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Download Predictions CSV
              </Button>
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {files.map((file, idx) => (
          <Card key={idx}>
            <CardHeader className="py-2">
              <CardTitle className="text-sm font-medium">
                {file.file_name || file.file_type?.replace(/_/g, ' ') || `Chart ${idx + 1}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
              <img 
                src={file.file_url} 
                alt={file.file_name || file.file_type || 'MLJAR visualization'} 
                className="w-full h-auto"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MLJARVisualizations;
