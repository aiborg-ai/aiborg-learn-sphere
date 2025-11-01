/**
 * CSV Export Utility
 * Exports data to CSV format compliant with RFC 4180
 * Handles special characters, quotes, and UTF-8 encoding
 */

/**
 * Escape special characters in CSV cell
 * @param value Cell value
 * @returns Escaped value
 */
function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Check if escaping is needed
  const needsEscaping =
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r');

  if (!needsEscaping) {
    return stringValue;
  }

  // Escape double quotes by doubling them
  const escaped = stringValue.replace(/"/g, '""');

  // Wrap in quotes
  return `"${escaped}"`;
}

/**
 * Convert array of objects to CSV string
 * @param data Array of objects
 * @param headers Optional custom headers (uses object keys if not provided)
 * @returns CSV string
 */
export function arrayToCsv(
  data: Array<Record<string, any>>,
  headers?: string[]
): string {
  if (data.length === 0) {
    return '';
  }

  // Determine headers
  const csvHeaders = headers || Object.keys(data[0]);

  // Build CSV rows
  const rows: string[] = [];

  // Add header row
  rows.push(csvHeaders.map(escapeCsvCell).join(','));

  // Add data rows
  for (const row of data) {
    const cells = csvHeaders.map((header) => escapeCsvCell(row[header]));
    rows.push(cells.join(','));
  }

  return rows.join('\n');
}

/**
 * Export data to CSV file and trigger download
 * @param data Array of objects to export
 * @param filename Filename for the downloaded file
 * @param headers Optional custom headers
 */
export function exportToCSV(
  data: Array<Record<string, any>>,
  filename: string,
  headers?: string[]
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Convert data to CSV
  const csvContent = arrayToCsv(data, headers);

  // Add UTF-8 BOM for proper Excel compatibility
  const bom = '\uFEFF';
  const csvWithBom = bom + csvContent;

  // Create blob
  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Format date for CSV export
 * @param date Date object or string
 * @returns Formatted date string (YYYY-MM-DD HH:MM:SS)
 */
export function formatDateForCsv(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Format number for CSV export
 * @param value Number or string
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export function formatNumberForCsv(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return '';
  }

  return num.toFixed(decimals);
}

/**
 * Sanitize data for CSV export
 * Formats dates, numbers, and handles null values
 * @param data Array of objects
 * @param dateFields Array of field names that contain dates
 * @param numberFields Array of field names that contain numbers
 * @returns Sanitized data
 */
export function sanitizeForCsv(
  data: Array<Record<string, any>>,
  dateFields: string[] = [],
  numberFields: string[] = []
): Array<Record<string, any>> {
  return data.map((row) => {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(row)) {
      if (dateFields.includes(key)) {
        sanitized[key] = value ? formatDateForCsv(value) : '';
      } else if (numberFields.includes(key)) {
        sanitized[key] = value !== null && value !== undefined ? formatNumberForCsv(value) : '';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  });
}

/**
 * Export with metadata header
 * Adds metadata rows before the data (e.g., export date, filters applied)
 * @param data Array of objects to export
 * @param filename Filename for the downloaded file
 * @param metadata Object containing metadata key-value pairs
 * @param headers Optional custom headers
 */
export function exportWithMetadata(
  data: Array<Record<string, any>>,
  filename: string,
  metadata: Record<string, string>,
  headers?: string[]
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Build metadata rows
  const metadataRows: string[] = [];
  for (const [key, value] of Object.entries(metadata)) {
    metadataRows.push(`"${key}","${escapeCsvCell(value)}"`);
  }

  // Add blank line between metadata and data
  metadataRows.push('');

  // Convert data to CSV
  const dataContent = arrayToCsv(data, headers);

  // Combine metadata and data
  const csvContent = metadataRows.join('\n') + '\n' + dataContent;

  // Add UTF-8 BOM
  const bom = '\uFEFF';
  const csvWithBom = bom + csvContent;

  // Create blob and download
  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
