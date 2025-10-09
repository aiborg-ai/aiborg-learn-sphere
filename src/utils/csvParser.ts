import { logger } from './logger';

/**
 * Bulk enrollment CSV row structure
 */
export interface BulkEnrollmentRow {
  email: string;
  course_id: number;
  payment_amount: number;
  payment_status: 'completed' | 'pending' | 'failed';
  payment_method: 'manual' | 'card' | 'upi' | 'bank' | 'cash';
}

/**
 * Validation error for a CSV row
 */
export interface CSVRowError {
  row: number;
  field: string;
  value: string;
  error: string;
}

/**
 * CSV parsing result
 */
export interface CSVParseResult {
  success: boolean;
  data: BulkEnrollmentRow[];
  errors: CSVRowError[];
  totalRows: number;
  validRows: number;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate payment status
 */
function isValidPaymentStatus(status: string): status is BulkEnrollmentRow['payment_status'] {
  return ['completed', 'pending', 'failed'].includes(status);
}

/**
 * Validate payment method
 */
function isValidPaymentMethod(method: string): method is BulkEnrollmentRow['payment_method'] {
  return ['manual', 'card', 'upi', 'bank', 'cash'].includes(method);
}

/**
 * Validate a single row of CSV data
 */
function validateRow(
  row: Record<string, string>,
  rowNumber: number
): { valid: boolean; data?: BulkEnrollmentRow; errors: CSVRowError[] } {
  const errors: CSVRowError[] = [];

  // Validate email
  const email = row.email?.trim();
  if (!email) {
    errors.push({
      row: rowNumber,
      field: 'email',
      value: email || '',
      error: 'Email is required',
    });
  } else if (!isValidEmail(email)) {
    errors.push({
      row: rowNumber,
      field: 'email',
      value: email,
      error: 'Invalid email format',
    });
  }

  // Validate course_id
  const courseIdStr = row.course_id?.trim();
  const courseId = parseInt(courseIdStr, 10);
  if (!courseIdStr) {
    errors.push({
      row: rowNumber,
      field: 'course_id',
      value: courseIdStr || '',
      error: 'Course ID is required',
    });
  } else if (isNaN(courseId) || courseId <= 0) {
    errors.push({
      row: rowNumber,
      field: 'course_id',
      value: courseIdStr,
      error: 'Course ID must be a positive number',
    });
  }

  // Validate payment_amount
  const amountStr = row.payment_amount?.trim();
  const amount = parseFloat(amountStr);
  if (!amountStr) {
    errors.push({
      row: rowNumber,
      field: 'payment_amount',
      value: amountStr || '',
      error: 'Payment amount is required',
    });
  } else if (isNaN(amount) || amount < 0) {
    errors.push({
      row: rowNumber,
      field: 'payment_amount',
      value: amountStr,
      error: 'Payment amount must be a non-negative number',
    });
  }

  // Validate payment_status
  const paymentStatus = row.payment_status?.trim();
  if (!paymentStatus) {
    errors.push({
      row: rowNumber,
      field: 'payment_status',
      value: paymentStatus || '',
      error: 'Payment status is required',
    });
  } else if (!isValidPaymentStatus(paymentStatus)) {
    errors.push({
      row: rowNumber,
      field: 'payment_status',
      value: paymentStatus,
      error: 'Payment status must be: completed, pending, or failed',
    });
  }

  // Validate payment_method
  const paymentMethod = row.payment_method?.trim();
  if (!paymentMethod) {
    errors.push({
      row: rowNumber,
      field: 'payment_method',
      value: paymentMethod || '',
      error: 'Payment method is required',
    });
  } else if (!isValidPaymentMethod(paymentMethod)) {
    errors.push({
      row: rowNumber,
      field: 'payment_method',
      value: paymentMethod,
      error: 'Payment method must be: manual, card, upi, bank, or cash',
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      email: email!,
      course_id: courseId,
      payment_amount: amount,
      payment_status: paymentStatus as BulkEnrollmentRow['payment_status'],
      payment_method: paymentMethod as BulkEnrollmentRow['payment_method'],
    },
    errors: [],
  };
}

/**
 * Parse CSV file content
 */
export function parseCSV(csvText: string): CSVParseResult {
  try {
    const lines = csvText.trim().split('\n');

    if (lines.length === 0) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, field: 'file', value: '', error: 'CSV file is empty' }],
        totalRows: 0,
        validRows: 0,
      };
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = [
      'email',
      'course_id',
      'payment_amount',
      'payment_status',
      'payment_method',
    ];

    // Validate headers
    const missingHeaders = requiredHeaders.filter(h => !header.includes(h));
    if (missingHeaders.length > 0) {
      return {
        success: false,
        data: [],
        errors: [
          {
            row: 0,
            field: 'headers',
            value: header.join(', '),
            error: `Missing required headers: ${missingHeaders.join(', ')}`,
          },
        ],
        totalRows: 0,
        validRows: 0,
      };
    }

    // Parse data rows
    const validData: BulkEnrollmentRow[] = [];
    const allErrors: CSVRowError[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const values = line.split(',').map(v => v.trim());
      const rowData: Record<string, string> = {};

      header.forEach((key, index) => {
        rowData[key] = values[index] || '';
      });

      const validation = validateRow(rowData, i + 1);
      if (validation.valid && validation.data) {
        validData.push(validation.data);
      } else {
        allErrors.push(...validation.errors);
      }
    }

    const totalRows = lines.length - 1; // Exclude header
    const validRows = validData.length;

    logger.log(`CSV parsed: ${validRows}/${totalRows} valid rows`);

    return {
      success: allErrors.length === 0,
      data: validData,
      errors: allErrors,
      totalRows,
      validRows,
    };
  } catch (error) {
    logger.error('CSV parsing error:', error);
    return {
      success: false,
      data: [],
      errors: [
        {
          row: 0,
          field: 'file',
          value: '',
          error: error instanceof Error ? error.message : 'Unknown parsing error',
        },
      ],
      totalRows: 0,
      validRows: 0,
    };
  }
}

/**
 * Generate CSV template for bulk enrollment
 */
export function generateBulkEnrollmentTemplate(): string {
  const headers = ['email', 'course_id', 'payment_amount', 'payment_status', 'payment_method'];
  const exampleRow = ['user@example.com', '1', '99.99', 'completed', 'card'];
  const exampleRow2 = ['student@school.edu', '2', '149.99', 'pending', 'upi'];

  return [headers.join(','), exampleRow.join(','), exampleRow2.join(',')].join('\n');
}

/**
 * Generate error report CSV
 */
export function generateErrorReportCSV(errors: CSVRowError[]): string {
  const headers = ['Row', 'Field', 'Value', 'Error'];
  const rows = errors.map(e => [e.row.toString(), e.field, e.value, e.error]);

  return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
}
