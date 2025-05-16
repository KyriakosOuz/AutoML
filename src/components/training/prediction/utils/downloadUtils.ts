
export const convertToCSV = (data: Record<string, any>[]): string => {
  if (!data.length) return '';
  
  // Filter out class_probabilities from headers
  const headers = Object.keys(data[0]).filter(header => header !== 'class_probabilities');
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Only stringify objects that aren't class_probabilities
      const cellValue = typeof val === 'object' && header !== 'class_probabilities' 
        ? JSON.stringify(val) 
        : val;
      // Escape quotes and wrap in quotes if contains comma
      return `"${String(cellValue).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

export const downloadCSV = (data: Record<string, any>[], filename: string) => {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadJSON = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Function to download a file from a URL by fetching it first
export const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }
    
    // Get the content type to determine how to handle the file
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      // For JSON files
      const jsonData = await response.json();
      downloadJSON(jsonData, filename);
    } else if (contentType && contentType.includes('text/csv')) {
      // For CSV files
      const text = await response.text();
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', downloadUrl);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } else {
      // For all other file types, use a direct download approach
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', downloadUrl);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    // Fall back to the direct link method if the fetch fails
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
