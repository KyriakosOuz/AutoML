
import { API_BASE_URL } from '@/lib/constants';
import { getAuthHeaders, handleApiResponse } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ApiResponse } from '@/types/api';

// Define the expected response type
interface DownloadResponse {
  download_url: string;
}

export const useDatasetDownload = () => {
  const { toast } = useToast();

  const downloadDataset = async (datasetId: string, stage: string, fileName?: string) => {
    try {
      // First get the download URL with proper authentication
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/dataset-management/download/${datasetId}?stage=${stage}`, {
        headers
      });
      
      const result = await handleApiResponse<DownloadResponse>(response);
      
      if (!result.data || !result.data.download_url) {
        console.error('Download error: Missing download URL in response', result);
        throw new Error('No download URL received');
      }
      
      const downloadUrl = result.data.download_url;
      
      // Create a temporary link to trigger the download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || `dataset_${stage}.csv`; // Default filename if none provided
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: `Your ${stage} dataset download has started.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to start download",
        variant: "destructive"
      });
    }
  };

  return { downloadDataset };
};
