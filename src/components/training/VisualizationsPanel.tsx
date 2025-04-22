
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface VisualizationFile {
  file_type: string;
  file_url: string;
  file_name?: string;
}

interface VisualizationsPanelProps {
  files: VisualizationFile[];
}

const VisualizationsPanel: React.FC<VisualizationsPanelProps> = ({ files }) => {
  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-muted-foreground">
          No visualizations available for this experiment.
        </span>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {files.map((file, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="py-2 px-4 bg-muted/30">
            <CardTitle className="text-sm font-medium">
              {file.file_type.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <img 
              src={file.file_url} 
              alt={file.file_type} 
              className="w-full rounded-md"
            />
            <div className="mt-2 flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VisualizationsPanel;
