
import { API_BASE_URL } from '@/lib/constants';
import { getAuthHeaders, handleApiResponse } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ApiResponse } from '@/types/api';

interface DownloadResponse {
  download_url: string;
}

export const useDatasetDownload = () => {
  const { toast } = useToast();

  const downloadDataset = async (datasetId: string, stage: string, fileName?: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/dataset-management/download/${datasetId}?stage=${stage}`, {
        headers
      });
      
      const result = await handleApiResponse<DownloadResponse>(response);
      const downloadUrl = result.data.download_url;

      if (!downloadUrl) {
        throw new Error('No download URL received');
      }

      // Fetch the file content using the download URL
      const fileResponse = await fetch(downloadUrl);
      const blob = await fileResponse.blob();
      
      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || `dataset_${stage}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);

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
