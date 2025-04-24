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
