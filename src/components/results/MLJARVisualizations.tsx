
import React, { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, ImageIcon } from 'lucide-react';

interface MLJARVisualizationsProps {
  files: Array<{
    file_id?: string;
    file_name?: string;
    file_type?: string;
    file_url: string;
    file_content?: string;
    curve_subtype?: string;
  }>;
}

const MLJARVisualizations: React.FC<MLJARVisualizationsProps> = ({ files }) => {
  const categorizedVisuals = useMemo(() => {
    const result = {
      roc_curves: [] as typeof files,
      precision_recall: [] as typeof files,
      learning_curves: [] as typeof files,
      calibration_curves: [] as typeof files,
      ks_statistic: [] as typeof files,
      lift_curves: [] as typeof files,
      cumulative_gains: [] as typeof files,
      other: [] as typeof files
    };

    const processedFileIds = new Set<string>();

    files.forEach(file => {
      // Look at both file_name and file_url for categorization
      const fileNameLower = (file.file_name || '').toLowerCase();
      const fileUrlLower = file.file_url.toLowerCase();
      const fileTypeLower = (file.file_type || '').toLowerCase();
      let category: keyof typeof result | null = null;

      // Process based on curve_subtype first (most reliable)
      if (file.curve_subtype) {
        if (file.curve_subtype === 'roc') {
          category = 'roc_curves';
        } else if (file.curve_subtype === 'precision_recall') {
          category = 'precision_recall';
        } else if (file.curve_subtype === 'calibration') {
          category = 'calibration_curves';
        }
      } 
      
      // Then check by file_type
      else if (fileTypeLower.includes('roc_curve')) {
        category = 'roc_curves';
      } else if (fileTypeLower.includes('precision_recall')) {
        category = 'precision_recall';
      } else if (
        fileTypeLower.includes('learning_curve') || 
        fileTypeLower.includes('learning_curves')
      ) {
        category = 'learning_curves';
      } else if (fileTypeLower.includes('calibration_curve')) {
        category = 'calibration_curves';
      } else if (fileTypeLower.includes('ks_statistic')) {
        category = 'ks_statistic';
      } else if (fileTypeLower.includes('lift_curve')) {
        category = 'lift_curves';
      } else if (fileTypeLower.includes('cumulative_gains')) {
        category = 'cumulative_gains';
      }
      
      // Then check by file_name
      else if (
        fileNameLower.includes('roc_curve') || 
        fileUrlLower.includes('roc_curve') || 
        fileUrlLower.includes('roc-curve')
      ) {
        category = 'roc_curves';
      } else if (
        fileNameLower.includes('precision_recall') || 
        fileUrlLower.includes('precision_recall') || 
        fileUrlLower.includes('precision-recall')
      ) {
        category = 'precision_recall';
      } else if (
        fileNameLower.includes('learning_curve') || 
        fileUrlLower.includes('learning_curve') || 
        fileNameLower.includes('learning_curves') || 
        fileUrlLower.includes('learning_curves')
      ) {
        category = 'learning_curves';
      } else if (fileUrlLower.endsWith('.png')) {
        category = 'other';
      }

      if (category && file.file_id) {
        // Prevent duplicates when file is categorized from multiple criteria
        if (!processedFileIds.has(file.file_id)) {
          result[category].push(file);
          processedFileIds.add(file.file_id);
        }
      } else if (category) {
        // If no file_id exists, we can't track duplicates, so just add
        result[category].push(file);
      }
    });

    // Add any files with PNGs that were not captured in previous groups
    const unmatched = files.filter(f => 
      f.file_url?.endsWith('.png') && 
      (!f.file_id || !processedFileIds.has(f.file_id))
    );

    if (unmatched.length > 0) {
      result.other.push(...unmatched);
    }

    console.log("[MLJARVisualizations] Categorized visuals:", {
      roc_curves: result.roc_curves.length,
      precision_recall: result.precision_recall.length,
      learning_curves: result.learning_curves.length,
      calibration_curves: result.calibration_curves.length,
      ks_statistic: result.ks_statistic.length,
      lift_curves: result.lift_curves.length,
      cumulative_gains: result.cumulative_gains.length,
      other: result.other.length
    });

    return result;
  }, [files]);

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Visualizations Available</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          No MLJAR visualizations were found for this experiment.
        </p>
      </div>
    );
  }

  // If we only have 'other' category with fewer than 5 items, show a grid
  const onlyHasOther = Object.keys(categorizedVisuals).filter(
    k => k !== 'other' && (categorizedVisuals as any)[k].length > 0
  ).length === 0;

  if (onlyHasOther && categorizedVisuals.other.length < 5) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {files.map((file, index) => (
          <VisualizationCard key={index} file={file} />
        ))}
      </div>
    );
  }

  // Otherwise, use tabs for organization
  return (
    <Tabs defaultValue={getDefaultTab(categorizedVisuals)} className="w-full">
      <TabsList className="mb-4 flex flex-wrap">
        {categorizedVisuals.roc_curves.length > 0 && (
          <TabsTrigger value="roc_curves">ROC Curves</TabsTrigger>
        )}
        {categorizedVisuals.precision_recall.length > 0 && (
          <TabsTrigger value="precision_recall">Precision-Recall</TabsTrigger>
        )}
        {categorizedVisuals.learning_curves.length > 0 && (
          <TabsTrigger value="learning_curves">Learning Curves</TabsTrigger>
        )}
        {categorizedVisuals.calibration_curves.length > 0 && (
          <TabsTrigger value="calibration_curves">Calibration Curves</TabsTrigger>
        )}
        {categorizedVisuals.ks_statistic.length > 0 && (
          <TabsTrigger value="ks_statistic">KS Statistic</TabsTrigger>
        )}
        {categorizedVisuals.lift_curves.length > 0 && (
          <TabsTrigger value="lift_curves">Lift Curves</TabsTrigger>
        )}
        {categorizedVisuals.cumulative_gains.length > 0 && (
          <TabsTrigger value="cumulative_gains">Cumulative Gains</TabsTrigger>
        )}
        {categorizedVisuals.other.length > 0 && (
          <TabsTrigger value="other">Other Plots</TabsTrigger>
        )}
      </TabsList>

      {categorizedVisuals.roc_curves.length > 0 && (
        <TabsContent value="roc_curves" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categorizedVisuals.roc_curves.map((file, index) => (
              <VisualizationCard key={index} file={file} />
            ))}
          </div>
        </TabsContent>
      )}

      {categorizedVisuals.precision_recall.length > 0 && (
        <TabsContent value="precision_recall" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categorizedVisuals.precision_recall.map((file, index) => (
              <VisualizationCard key={index} file={file} />
            ))}
          </div>
        </TabsContent>
      )}

      {categorizedVisuals.learning_curves.length > 0 && (
        <TabsContent value="learning_curves" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categorizedVisuals.learning_curves.map((file, index) => (
              <VisualizationCard key={index} file={file} />
            ))}
          </div>
        </TabsContent>
      )}

      {categorizedVisuals.calibration_curves.length > 0 && (
        <TabsContent value="calibration_curves" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categorizedVisuals.calibration_curves.map((file, index) => (
              <VisualizationCard key={index} file={file} />
            ))}
          </div>
        </TabsContent>
      )}

      {categorizedVisuals.ks_statistic.length > 0 && (
        <TabsContent value="ks_statistic" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categorizedVisuals.ks_statistic.map((file, index) => (
              <VisualizationCard key={index} file={file} />
            ))}
          </div>
        </TabsContent>
      )}

      {categorizedVisuals.lift_curves.length > 0 && (
        <TabsContent value="lift_curves" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categorizedVisuals.lift_curves.map((file, index) => (
              <VisualizationCard key={index} file={file} />
            ))}
          </div>
        </TabsContent>
      )}

      {categorizedVisuals.cumulative_gains.length > 0 && (
        <TabsContent value="cumulative_gains" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categorizedVisuals.cumulative_gains.map((file, index) => (
              <VisualizationCard key={index} file={file} />
            ))}
          </div>
        </TabsContent>
      )}

      {categorizedVisuals.other.length > 0 && (
        <TabsContent value="other" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categorizedVisuals.other.map((file, index) => (
              <VisualizationCard key={index} file={file} />
            ))}
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
};

// Helper component for visualizations
const VisualizationCard = ({ file }: { file: MLJARVisualizationsProps['files'][0] }) => {
  // Get a friendly name for the visualization
  const getVisualizationName = () => {
    // First check for curve subtype
    if (file.curve_subtype) {
      if (file.curve_subtype === 'roc') {
        return 'ROC Curve';
      }
      if (file.curve_subtype === 'precision_recall') {
        return 'Precision-Recall Curve';
      }
      if (file.curve_subtype === 'calibration') {
        return 'Calibration Curve';
      }
    }
    
    const fileName = file.file_name || file.file_url.split('/').pop() || '';
    const fileType = file.file_type || '';
    
    if (fileName.includes('learning_curve') || fileName.includes('learning_curves')) {
      return 'Learning Curve';
    }
    if (fileName.includes('roc_curve') || fileType.includes('roc_curve')) {
      return 'ROC Curve';
    }
    if (fileName.includes('precision_recall') || fileType.includes('precision_recall')) {
      return 'Precision-Recall Curve';
    }
    if (fileName.includes('calibration') || fileType.includes('calibration')) {
      return 'Calibration Curve';
    }
    if (fileName.includes('ks_statistic') || fileType.includes('ks_statistic')) {
      return 'KS Statistic';
    }
    if (fileName.includes('lift_curve') || fileType.includes('lift_curve')) {
      return 'Lift Curve';
    }
    if (fileName.includes('cumulative_gains') || fileType.includes('cumulative_gains')) {
      return 'Cumulative Gains Curve';
    }
    
    // Return a cleaned up version of the file name
    return fileName
      .replace(/[_-]/g, ' ')
      .replace(/\.png$/, '')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="aspect-video bg-muted flex items-center justify-center rounded-md relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${file.file_url})` }}
              />
              <div className="absolute inset-0 bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors" />
            </div>
            <div className="mt-2 text-center">
              <p className="text-sm font-medium">{getVisualizationName()}</p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <div className="p-1">
          <img 
            src={file.file_url} 
            alt={getVisualizationName()}
            className="w-full rounded-md"
          />
          <div className="mt-2 flex justify-between items-center">
            <h3 className="font-medium">{getVisualizationName()}</h3>
            <Button variant="outline" size="sm" asChild>
              <a 
                href={file.file_url} 
                download={file.file_name || `${getVisualizationName()}.png`}
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
  );
};

// Helper function to determine default tab
const getDefaultTab = (categorizedVisuals: ReturnType<typeof useMemo<any>>) => {
  if (categorizedVisuals.roc_curves.length > 0) return 'roc_curves';
  if (categorizedVisuals.precision_recall.length > 0) return 'precision_recall';
  if (categorizedVisuals.learning_curves.length > 0) return 'learning_curves';
  if (categorizedVisuals.calibration_curves.length > 0) return 'calibration_curves';
  if (categorizedVisuals.ks_statistic.length > 0) return 'ks_statistic';
  if (categorizedVisuals.lift_curves.length > 0) return 'lift_curves';
  if (categorizedVisuals.cumulative_gains.length > 0) return 'cumulative_gains';
  return 'other';
};

export default MLJARVisualizations;
