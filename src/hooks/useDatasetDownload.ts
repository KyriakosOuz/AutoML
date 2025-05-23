
import { getAuthHeaders, handleApiResponse, getWorkingAPIUrl } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ApiResponse } from '@/types/api';

interface DownloadResponse {
  download_url: string;
}

export const useDatasetDownload = () => {
  const downloadDataset = async (datasetId: string, stage: string, fileName?: string) => {
    try {
      const headers = await getAuthHeaders();
      const apiUrl = await getWorkingAPIUrl();
      
      console.log("🌍 API base:", apiUrl);
      console.log("[Download] Calling:", `${apiUrl}/dataset-management/download/${datasetId}?stage=${stage}`);
      
      const response = await fetch(`${apiUrl}/dataset-management/download/${datasetId}?stage=${stage}`, {
        headers
      });
      
      const result = await handleApiResponse<DownloadResponse>(response);
      const downloadUrl = result.data.download_url;

      if (!downloadUrl) {
        throw new Error('No download URL received');
      }

      // Check if the download URL is using localhost
      if (apiUrl.includes('localhost') && !downloadUrl.includes('localhost')) {
        console.warn("⚠️ Warning: API is on localhost but download URL is not:", downloadUrl);
      }

      // Fetch the file content using the download URL
      console.log("[Download] Fetching file from:", downloadUrl);
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
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Download Started", {
        description: `Your ${stage} dataset download has started.`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Download Failed", {
        description: error instanceof Error ? error.message : "Failed to start download"
      });
    }
  };

  return { downloadDataset };
};
