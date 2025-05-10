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

// Updated function to download a file from a URL
export const downloadFile = async (url: string, filename: string) => {
  try {
    // Fetch the file content
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    
    // Convert the response to a blob
    const blob = await response.blob();
    
    // Create object URL from blob
    const objectUrl = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename; // This will force download instead of navigation
    
    // Append to the document, click, and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Release the object URL when done
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 100);
    
  } catch (error) {
    console.error('Error downloading file:', error);
    // Fallback to direct link with download attribute as a last resort
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank'; // Open in new tab if fetch approach fails
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
