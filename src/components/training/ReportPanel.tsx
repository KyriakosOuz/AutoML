
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

interface ReportPanelProps {
  modelFileUrl?: string;
  reportFileUrl?: string;
}

const ReportPanel: React.FC<ReportPanelProps> = ({
  modelFileUrl,
  reportFileUrl,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-6">
      {modelFileUrl && (
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trained Model</CardTitle>
            <CardDescription>Download the trained model file</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button asChild>
              <a href={modelFileUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download Model
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
      {reportFileUrl && (
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Full Report</CardTitle>
            <CardDescription>View the complete analysis report</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button asChild>
              <a href={reportFileUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                View Full Report
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
      {!modelFileUrl && !reportFileUrl && (
        <div className="text-center py-4">
          <p className="text-muted-foreground">
            No additional reports are available for this experiment.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportPanel;
