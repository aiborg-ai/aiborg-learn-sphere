/**
 * Enhanced PDF Export Service
 * Advanced PDF export with multi-chart support, custom templates, and flexible layouts
 */

import { logger } from '@/utils/logger';
import type { DateRange } from '@/utils/pdfExport';

export interface ChartSection {
  elementId: string;
  title: string;
  description?: string;
  includeInExport: boolean;
  pageBreakBefore?: boolean;
  pageBreakAfter?: boolean;
}

export interface ReportTemplate {
  name: string;
  orientation: 'portrait' | 'landscape';
  pageSize: 'a4' | 'letter' | 'legal';
  includeCoverPage: boolean;
  includeTableOfContents: boolean;
  includeFooter: boolean;
  includeHeader: boolean;
  brandColor: string;
  font: 'helvetica' | 'times' | 'courier';
}

export interface ReportMetadata {
  title: string;
  subtitle?: string;
  author?: string;
  department?: string;
  dateRange?: DateRange;
  generatedDate: Date;
  customFields?: Record<string, string>;
}

export interface EnhancedPDFConfig {
  sections: ChartSection[];
  metadata: ReportMetadata;
  template: ReportTemplate;
  filename: string;
}

export const DEFAULT_TEMPLATES: Record<string, ReportTemplate> = {
  standard: {
    name: 'Standard Report',
    orientation: 'portrait',
    pageSize: 'a4',
    includeCoverPage: true,
    includeTableOfContents: false,
    includeFooter: true,
    includeHeader: true,
    brandColor: '#9333ea', // Purple-600
    font: 'helvetica',
  },
  detailed: {
    name: 'Detailed Analytics',
    orientation: 'portrait',
    pageSize: 'a4',
    includeCoverPage: true,
    includeTableOfContents: true,
    includeFooter: true,
    includeHeader: true,
    brandColor: '#9333ea',
    font: 'helvetica',
  },
  executive: {
    name: 'Executive Summary',
    orientation: 'landscape',
    pageSize: 'letter',
    includeCoverPage: true,
    includeTableOfContents: false,
    includeFooter: true,
    includeHeader: false,
    brandColor: '#1e40af', // Blue-800
    font: 'helvetica',
  },
  compact: {
    name: 'Compact Report',
    orientation: 'portrait',
    pageSize: 'a4',
    includeCoverPage: false,
    includeTableOfContents: false,
    includeFooter: true,
    includeHeader: false,
    brandColor: '#9333ea',
    font: 'helvetica',
  },
};

export class EnhancedPDFExportService {
  /**
   * Export analytics to PDF with enhanced features
   */
  static async exportToPDF(config: EnhancedPDFConfig): Promise<void> {
    try {
      logger.info('Starting enhanced PDF export', {
        filename: config.filename,
        sectionCount: config.sections.length,
        template: config.template.name,
      });

      // Dynamically import libraries
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      // Validate sections
      const validSections = config.sections.filter(s => s.includeInExport);
      if (validSections.length === 0) {
        throw new Error('No sections selected for export');
      }

      // Create PDF document
      const pdf = new jsPDF({
        orientation: config.template.orientation,
        unit: 'mm',
        format: config.template.pageSize,
      });

      // Get page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;

      // Parse brand color
      const brandColor = this.hexToRgb(config.template.brandColor);

      // Add cover page if enabled
      if (config.template.includeCoverPage) {
        this.addCoverPage(pdf, config.metadata, brandColor, pageWidth, pageHeight, margin);
        pdf.addPage();
      }

      // Add table of contents if enabled
      const tableOfContents: Array<{ title: string; page: number }> = [];
      if (config.template.includeTableOfContents) {
        // Reserve space for TOC (will be filled later)
        pdf.addPage();
      }

      let currentY = margin;

      // Process each section
      for (let i = 0; i < validSections.length; i++) {
        const section = validSections[i];

        // Page break before if specified
        if (section.pageBreakBefore && i > 0) {
          pdf.addPage();
          currentY = margin;
        }

        const element = document.getElementById(section.elementId);
        if (!element) {
          logger.warn(`Element ${section.elementId} not found, skipping`);
          continue;
        }

        // Add section to TOC
        const currentPage = pdf.getCurrentPageInfo().pageNumber;
        tableOfContents.push({ title: section.title, page: currentPage });

        // Add section header
        if (config.template.includeHeader) {
          pdf.setFontSize(14);
          pdf.setTextColor(0, 0, 0);

          if (currentY > pageHeight - 50) {
            pdf.addPage();
            currentY = margin;
          }

          pdf.text(section.title, margin, currentY);
          currentY += 8;

          if (section.description) {
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            const descLines = pdf.splitTextToSize(section.description, contentWidth);
            pdf.text(descLines, margin, currentY);
            currentY += 5 * descLines.length;
          }
        }

        // Capture section as canvas
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          imageTimeout: 0,
        });

        // Calculate dimensions
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Check if image fits on current page
        if (currentY + imgHeight > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }

        // Add image to PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', margin, currentY, imgWidth, imgHeight);

        currentY += imgHeight + 10;

        // Page break after if specified
        if (section.pageBreakAfter && i < validSections.length - 1) {
          pdf.addPage();
          currentY = margin;
        }

        // Add page break if needed
        if (currentY > pageHeight - margin && i < validSections.length - 1) {
          pdf.addPage();
          currentY = margin;
        }
      }

      // Fill table of contents if enabled
      if (config.template.includeTableOfContents && tableOfContents.length > 0) {
        this.addTableOfContents(
          pdf,
          tableOfContents,
          brandColor,
          pageWidth,
          pageHeight,
          margin,
          config.template.includeCoverPage ? 2 : 1
        );
      }

      // Add footers if enabled
      if (config.template.includeFooter) {
        this.addFooters(pdf, config.metadata, pageWidth, pageHeight, margin);
      }

      // Save PDF
      const filename = config.filename.endsWith('.pdf')
        ? config.filename
        : `${config.filename}.pdf`;
      pdf.save(filename);

      logger.info('Enhanced PDF export completed', { filename });
    } catch (_error) {
      logger.error('Error in enhanced PDF export:', _error);
      throw error;
    }
  }

  /**
   * Add cover page to PDF
   */
  private static addCoverPage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdf: any,
    metadata: ReportMetadata,
    brandColor: { r: number; g: number; b: number },
    pageWidth: number,
    pageHeight: number,
    _margin: number
  ): void {
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;

    // Add brand color bar at top
    pdf.setFillColor(brandColor.r, brandColor.g, brandColor.b);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    // Add logo/branding
    pdf.setFontSize(24);
    pdf.setTextColor(255, 255, 255);
    pdf.text('AIBORG Learn Sphere', centerX, 25, { align: 'center' });

    // Add report title
    pdf.setFontSize(28);
    pdf.setTextColor(0, 0, 0);
    pdf.text(metadata.title, centerX, centerY - 30, { align: 'center' });

    // Add subtitle if provided
    if (metadata.subtitle) {
      pdf.setFontSize(16);
      pdf.setTextColor(100, 100, 100);
      pdf.text(metadata.subtitle, centerX, centerY - 10, { align: 'center' });
    }

    // Add metadata
    pdf.setFontSize(12);
    pdf.setTextColor(80, 80, 80);
    let metaY = centerY + 20;

    if (metadata.author) {
      pdf.text(`Author: ${metadata.author}`, centerX, metaY, { align: 'center' });
      metaY += 8;
    }

    if (metadata.department) {
      pdf.text(`Department: ${metadata.department}`, centerX, metaY, { align: 'center' });
      metaY += 8;
    }

    if (metadata.dateRange) {
      const start = metadata.dateRange.startDate
        ? new Date(metadata.dateRange.startDate).toLocaleDateString()
        : '';
      const end = metadata.dateRange.endDate
        ? new Date(metadata.dateRange.endDate).toLocaleDateString()
        : '';
      if (start && end) {
        pdf.text(`Period: ${start} - ${end}`, centerX, metaY, { align: 'center' });
        metaY += 8;
      }
    }

    // Add generation date
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    const genDate = metadata.generatedDate.toLocaleString();
    pdf.text(`Generated: ${genDate}`, centerX, pageHeight - 20, { align: 'center' });

    // Add custom fields if provided
    if (metadata.customFields) {
      metaY += 10;
      pdf.setFontSize(11);
      pdf.setTextColor(80, 80, 80);
      for (const [key, value] of Object.entries(metadata.customFields)) {
        pdf.text(`${key}: ${value}`, centerX, metaY, { align: 'center' });
        metaY += 7;
      }
    }
  }

  /**
   * Add table of contents
   */
  private static addTableOfContents(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdf: any,
    toc: Array<{ title: string; page: number }>,
    brandColor: { r: number; g: number; b: number },
    pageWidth: number,
    pageHeight: number,
    margin: number,
    tocPageNumber: number
  ): void {
    // Go to TOC page
    pdf.setPage(tocPageNumber);

    let currentY = margin;

    // Add title
    pdf.setFontSize(20);
    pdf.setTextColor(brandColor.r, brandColor.g, brandColor.b);
    pdf.text('Table of Contents', margin, currentY);
    currentY += 15;

    // Add separator line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    // Add TOC entries
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);

    for (const entry of toc) {
      if (currentY > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }

      // Title
      const maxTitleWidth = pageWidth - margin * 2 - 30;
      const titleLines = pdf.splitTextToSize(entry.title, maxTitleWidth);
      pdf.text(titleLines[0], margin, currentY);

      // Page number
      pdf.text(String(entry.page), pageWidth - margin - 15, currentY, { align: 'right' });

      // Dotted line
      const titleWidth = pdf.getTextWidth(titleLines[0]);
      const dotsStart = margin + titleWidth + 3;
      const dotsEnd = pageWidth - margin - 20;
      pdf.setTextColor(150, 150, 150);
      pdf.text('.'.repeat(Math.floor((dotsEnd - dotsStart) / 2)), dotsStart, currentY);
      pdf.setTextColor(0, 0, 0);

      currentY += 8;
    }
  }

  /**
   * Add footers to all pages
   */
  private static addFooters(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdf: any,
    metadata: ReportMetadata,
    pageWidth: number,
    pageHeight: number,
    margin: number
  ): void {
    const pageCount = pdf.getNumberOfPages();
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);

      // Page number
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Report title on left
      pdf.text(metadata.title, margin, pageHeight - 10);

      // Copyright on right
      pdf.text('© AIBORG Learn Sphere', pageWidth - margin, pageHeight - 10, {
        align: 'right',
      });
    }
  }

  /**
   * Convert hex color to RGB
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 147, g: 51, b: 234 }; // Default purple
  }

  /**
   * Generate filename with timestamp
   */
  static generateFilename(prefix: string, dateRange?: DateRange): string {
    const date = new Date().toISOString().split('T')[0];
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate).toISOString().split('T')[0];
      const end = new Date(dateRange.endDate).toISOString().split('T')[0];
      return `${prefix}_${start}_to_${end}.pdf`;
    }
    return `${prefix}_${date}.pdf`;
  }
}
