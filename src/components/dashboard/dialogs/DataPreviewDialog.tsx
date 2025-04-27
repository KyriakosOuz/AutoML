
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { API_BASE_URL } from '@/lib/constants';
import { handleApiResponse, getAuthHeaders } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Download } from 'lucide-react';

interface DataPreviewDialogProps {
  datasetId: string;
  datasetName: string;
  stage: 'raw' | 'cleaned' | 'final' | 'processed';
  open: boolean;
  onClose: () => void;
}

interface DataPreview {
  columns: string[];
  data: Record<string, any>[];
  file_url?: string;
}

const DataPreviewDialog: React.FC<DataPreviewDialogProps> = ({
  datasetId,
  datasetName,
  stage: initialStage,
  open,
  onClose
}) => {
  const [stage, setStage] = useState<'raw' | 'cleaned' | 'final' | 'processed'>(initialStage);
  const [preview, setPreview] = useState<DataPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchPreview(datasetId, stage);
    }
  }, [open, datasetId, stage]);

  const fetchPreview = async (datasetId: string, stage: string) => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/dataset-management/preview-dataset/${datasetId}?stage=${stage}`, {
        method: 'GET',
        headers
      });
      
      const result = await handleApiResponse<DataPreview>(response);
      setPreview(result.data as DataPreview);
    } catch (error) {
      console.error('Error fetching dataset preview:', error);
      toast({
        title: 'Failed to load preview',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Dataset Preview: {datasetName}</DialogTitle>
          <DialogDescription>
            Preview of the first 10 rows of your dataset.
          </DialogDescription>
          
          <div className="mt-4">
            <ToggleGroup 
              type="single" 
              value={stage}
              onValueChange={(value) => value && setStage(value as any)}
              className="justify-start"
            >
              <ToggleGroupItem value="raw">Raw</ToggleGroupItem>
              <ToggleGroupItem value="cleaned">Cleaned</ToggleGroupItem>
              <ToggleGroupItem value="final">Final</ToggleGroupItem>
              <ToggleGroupItem value="processed">Processed</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto mt-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !preview || !preview.columns || !preview.data ? (
            <div className="text-center py-6 text-muted-foreground">
              No preview available for this stage.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {preview.columns.map((column, idx) => (
                    <TableHead key={idx} className="whitespace-nowrap">{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.data.map((row, rowIdx) => (
                  <TableRow key={rowIdx}>
                    {preview.columns.map((column, colIdx) => (
                      <TableCell key={`${rowIdx}-${colIdx}`} className="truncate max-w-[200px]">
                        {row[column] !== null && row[column] !== undefined ? String(row[column]) : 'null'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        
        <DialogFooter className="pt-4">
          {preview && preview.file_url && (
            <Button 
              variant="outline" 
              asChild
              className="mr-auto"
            >
              <a 
                href={preview.file_url} 
                download 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Download className="h-4 w-4 mr-2" />
                Download {stage.charAt(0).toUpperCase() + stage.slice(1)} Data
              </a>
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DataPreviewDialog;
