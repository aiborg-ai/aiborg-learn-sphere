import { sanitizeFileName } from './sanitizer';
import { logger } from '@/utils/logger';

/**
 * File upload validation and security utilities
 * @module file-validator
 */

/**
 * File validation configuration
 * @interface FileValidationConfig
 */
export interface FileValidationConfig {
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allowed MIME types */
  allowedMimeTypes?: string[];
  /** Allowed file extensions */
  allowedExtensions?: string[];
  /** Check file signature (magic bytes) */
  checkSignature?: boolean;
  /** Allow multiple files */
  multiple?: boolean;
  /** Maximum number of files (if multiple) */
  maxFiles?: number;
}

/**
 * File validation result
 * @interface FileValidationResult
 */
export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedName?: string;
  fileType?: string;
  fileSize?: number;
}

/**
 * File type signatures (magic bytes)
 */
const FILE_SIGNATURES: Record<string, { signature: number[]; mimeType: string }> = {
  // Images
  jpg: {
    signature: [0xff, 0xd8, 0xff],
    mimeType: 'image/jpeg',
  },
  png: {
    signature: [0x89, 0x50, 0x4e, 0x47],
    mimeType: 'image/png',
  },
  gif: {
    signature: [0x47, 0x49, 0x46],
    mimeType: 'image/gif',
  },
  webp: {
    signature: [0x52, 0x49, 0x46, 0x46],
    mimeType: 'image/webp',
  },

  // Documents
  pdf: {
    signature: [0x25, 0x50, 0x44, 0x46],
    mimeType: 'application/pdf',
  },
  zip: {
    signature: [0x50, 0x4b, 0x03, 0x04],
    mimeType: 'application/zip',
  },
  docx: {
    signature: [0x50, 0x4b, 0x03, 0x04],
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },

  // Videos
  mp4: {
    signature: [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70],
    mimeType: 'video/mp4',
  },
  avi: {
    signature: [0x52, 0x49, 0x46, 0x46],
    mimeType: 'video/x-msvideo',
  },
};

/**
 * Preset file validation configurations
 */
export const FileValidationPresets = {
  /** Image upload configuration */
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    checkSignature: true,
  },

  /** Document upload configuration */
  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    allowedExtensions: ['pdf', 'doc', 'docx', 'txt'],
    checkSignature: true,
  },

  /** Video upload configuration */
  video: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'],
    allowedExtensions: ['mp4', 'mpeg', 'mov', 'avi'],
    checkSignature: true,
  },

  /** Avatar upload configuration */
  avatar: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png'],
    allowedExtensions: ['jpg', 'jpeg', 'png'],
    checkSignature: true,
  },

  /** Assignment submission configuration */
  assignment: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    allowedExtensions: ['pdf', 'zip', 'doc', 'docx'],
    checkSignature: true,
    multiple: true,
    maxFiles: 5,
  },
};

/**
 * Validate a file against security rules
 * @param {File} file - File to validate
 * @param {FileValidationConfig} config - Validation configuration
 * @returns {Promise<FileValidationResult>} Validation result
 */
export async function validateFile(
  file: File,
  config: FileValidationConfig = {}
): Promise<FileValidationResult> {
  const errors: string[] = [];
  const result: FileValidationResult = {
    valid: true,
    errors,
    fileSize: file.size,
    fileType: file.type,
  };

  // Sanitize filename
  result.sanitizedName = sanitizeFileName(file.name);

  // Check file size
  if (config.maxSize && file.size > config.maxSize) {
    errors.push(`File size exceeds maximum allowed size of ${formatFileSize(config.maxSize)}`);
    result.valid = false;
  }

  // Check file extension
  const extension = getFileExtension(file.name);
  if (config.allowedExtensions && !config.allowedExtensions.includes(extension.toLowerCase())) {
    errors.push(`File extension .${extension} is not allowed`);
    result.valid = false;
  }

  // Check MIME type
  if (config.allowedMimeTypes && !config.allowedMimeTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
    result.valid = false;
  }

  // Check file signature (magic bytes)
  if (config.checkSignature) {
    const signatureValid = await checkFileSignature(file);
    if (!signatureValid) {
      errors.push('File signature validation failed - file may be corrupted or disguised');
      result.valid = false;
    }
  }

  // Check for potential malware patterns
  const malwareCheck = await scanForMalware(file);
  if (!malwareCheck.safe) {
    errors.push(malwareCheck.reason || 'Potential security threat detected in file');
    result.valid = false;
  }

  return result;
}

/**
 * Validate multiple files
 * @param {FileList | File[]} files - Files to validate
 * @param {FileValidationConfig} config - Validation configuration
 * @returns {Promise<FileValidationResult[]>} Array of validation results
 */
export async function validateFiles(
  files: FileList | File[],
  config: FileValidationConfig = {}
): Promise<FileValidationResult[]> {
  const fileArray = Array.from(files);

  // Check maximum number of files
  if (config.maxFiles && fileArray.length > config.maxFiles) {
    return [
      {
        valid: false,
        errors: [`Maximum ${config.maxFiles} files allowed, but ${fileArray.length} were provided`],
      },
    ];
  }

  // Validate each file
  const results = await Promise.all(fileArray.map(file => validateFile(file, config)));

  return results;
}

/**
 * Check file signature (magic bytes)
 * @param {File} file - File to check
 * @returns {Promise<boolean>} True if signature is valid
 */
async function checkFileSignature(file: File): Promise<boolean> {
  const extension = getFileExtension(file.name).toLowerCase();
  const expectedSignature = FILE_SIGNATURES[extension];

  if (!expectedSignature) {
    // No signature to check
    return true;
  }

  try {
    const buffer = await file.slice(0, 20).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check if file starts with expected signature
    for (let i = 0; i < expectedSignature.signature.length; i++) {
      if (bytes[i] !== expectedSignature.signature[i]) {
        return false;
      }
    }

    // Also verify MIME type matches
    return file.type === expectedSignature.mimeType;
  } catch {
    logger.error('Error checking file signature:', error);
    return false;
  }
}

/**
 * Scan file for potential malware patterns
 * @param {File} file - File to scan
 * @returns {Promise<{safe: boolean; reason?: string}>} Scan result
 */
async function scanForMalware(file: File): Promise<{ safe: boolean; reason?: string }> {
  // Check for executable file extensions disguised as other types
  const dangerousExtensions = [
    'exe',
    'bat',
    'cmd',
    'com',
    'pif',
    'scr',
    'vbs',
    'js',
    'jar',
    'msi',
    'app',
    'deb',
    'rpm',
  ];

  const fileName = file.name.toLowerCase();

  // Check for double extensions (e.g., document.pdf.exe)
  const parts = fileName.split('.');
  if (parts.length > 2) {
    for (const ext of dangerousExtensions) {
      if (parts.includes(ext)) {
        return {
          safe: false,
          reason: 'File contains potentially dangerous extension',
        };
      }
    }
  }

  // Check for suspicious patterns in filename
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|com|pif|scr|vbs|js)$/i,
    /%00/, // Null byte
    // eslint-disable-next-line no-control-regex
    /\x00/, // Null character
    /[<>:"|?*]/, // Invalid filename characters that might indicate injection
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fileName)) {
      return {
        safe: false,
        reason: 'Filename contains suspicious patterns',
      };
    }
  }

  // For text-based files, check content for scripts
  if (file.type.startsWith('text/') || file.type === 'application/xml') {
    try {
      const text = await file.text();
      const scriptPatterns = [
        /<script[\s\S]*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi, // Event handlers
        /<iframe/gi,
        /eval\s*\(/gi,
        /document\.write/gi,
      ];

      for (const pattern of scriptPatterns) {
        if (pattern.test(text)) {
          return {
            safe: false,
            reason: 'File contains potentially malicious scripts',
          };
        }
      }
    } catch {
      // If we can't read the file, assume it's binary and continue
    }
  }

  return { safe: true };
}

/**
 * Get file extension from filename
 * @param {string} filename - File name
 * @returns {string} File extension
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * Format file size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Create a secure file upload handler
 * @param {FileValidationConfig} config - Validation configuration
 * @returns {Function} Upload handler function
 */
export function createSecureUploadHandler(config: FileValidationConfig) {
  return async (
    files: FileList | File[]
  ): Promise<{
    valid: boolean;
    files: Array<{ file: File; sanitizedName: string }>;
    errors: string[];
  }> => {
    const results = await validateFiles(files, config);
    const validFiles: Array<{ file: File; sanitizedName: string }> = [];
    const allErrors: string[] = [];

    results.forEach((result, index) => {
      if (result.valid && result.sanitizedName) {
        const file = Array.from(files)[index];
        validFiles.push({
          file,
          sanitizedName: result.sanitizedName,
        });
      } else {
        allErrors.push(...result.errors);
      }
    });

    return {
      valid: allErrors.length === 0,
      files: validFiles,
      errors: allErrors,
    };
  };
}
