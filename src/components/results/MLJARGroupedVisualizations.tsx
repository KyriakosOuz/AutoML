
import React from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download } from 'lucide-react';

interface VisualizationFile {
  file_url: string;
  curve_subtype?: string;
  created_at: string;
  visualization_group?: string;
  file_name?: string;
}

interface GroupedVisualizations {
  [groupName: string]: VisualizationFile[];
}

interface MLJARGroupedVisualizationsProps {
  visualizations_grouped?: GroupedVisualizations;
}

const MLJARGroupedVisualizations: React.FC<MLJARGroupedVisualizationsProps> = ({ 
  visualizations_grouped = {} 
}) => {
  // Filter out non-image groups (readme, csv, model files)
  const visualizationGroups = React.useMemo(() => {
    const entries = Object.entries(visualizations_grouped);
    return entries.filter(([groupName, files]) => {
      // Skip if group is empty
      if (!files || files.length === 0) return false;
      
      // Skip non-visualization groups
      const excludedGroups = ['Model Files', 'CSV Files', 'README'];
      if (excludedGroups.includes(groupName)) return false;
      
      return true;
    });
  }, [visualizations_grouped]);

  if (!visualizationGroups.length) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No visualizations available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {visualizationGroups.map(([groupName, files]) => (
        <section key={groupName} className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">{groupName}</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {files.map((file, idx) => (
              <Dialog key={idx}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md overflow-hidden">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted flex items-center justify-center rounded-md relative overflow-hidden">
                        <div 
                          className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                          style={{ backgroundImage: `url(${file.file_url})` }}
                        />
                        <div className="absolute inset-0 bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors" />
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-sm font-medium">
                          {file.curve_subtype 
                            ? `${file.curve_subtype.replace(/_/g, ' ')}` 
                            : ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <div className="p-1">
                    <img 
                      src={file.file_url} 
                      alt={`${groupName} ${file.curve_subtype || ''}`} 
                      className="w-full rounded-md"
                    />
                    <div className="mt-2 flex justify-between items-center">
                      <h3 className="font-medium">
                        {groupName} {file.curve_subtype 
                          ? `(${file.curve_subtype.replace(/_/g, ' ')})` 
                          : ''}
                      </h3>
                      <Button variant="outline" size="sm" asChild>
                        <a 
                          href={file.file_url} 
                          download={file.file_name || `${groupName.toLowerCase().replace(/\s+/g, '-')}-${file.curve_subtype || 'chart'}.png`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default MLJARGroupedVisualizations;
