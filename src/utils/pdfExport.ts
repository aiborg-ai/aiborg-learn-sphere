import { logger } from './logger';

interface PDFExportOptions {
  filename?: string;
  quality?: number;
  scale?: number;
}

/**
 * Export an HTML element to PDF
 * Uses dynamic imports to lazy-load jsPDF and html2canvas (saves ~532 KB from initial bundle)
 * @param elementId - ID of the HTML element to export
 * @param options - Export options
 */
export const exportToPDF = async (
  elementId: string,
  options: PDFExportOptions = {}
): Promise<void> => {
  const { filename = 'document.pdf', quality = 0.95, scale = 2 } = options;

  try {
    const element = document.getElementById(elementId);

    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Show loading state
    logger.log('Starting PDF generation...');

    // Dynamically import heavy libraries only when needed
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 0,
      onclone: clonedDoc => {
        // Enhance print styles in cloned document
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          clonedElement.style.padding = '20px';
        }
      },
    });

    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pageHeight = 297; // A4 height in mm

    // Create PDF
    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? 'portrait' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/jpeg', quality);

    // Handle multi-page PDF
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    pdf.save(filename);
    logger.log(`PDF generated successfully: ${filename}`);
  } catch (error) {
    logger.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Analytics Section for PDF Export
 */
export interface AnalyticsSection {
  title: string;
  elementId: string;
  includeInExport: boolean;
}

/**
 * Date Range for PDF Export Metadata
 */
export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  preset?: string;
}

/**
 * Export analytics dashboard to PDF with branding and metadata
 * @param sections Array of sections to include in export
 * @param dateRange Applied date range filter
 * @param filename Custom filename
 */
export const exportAnalyticsToPDF = async (
  sections: AnalyticsSection[],
  dateRange: DateRange,
  filename: string = 'analytics-report.pdf'
): Promise<void> => {
  try {
    logger.log('Starting analytics PDF export...');

    // Dynamically import libraries
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let currentY = margin;

    // Add branding header
    pdf.setFontSize(20);
    pdf.setTextColor(147, 51, 234); // Purple-600
    pdf.text('AIBORG Learn Sphere', margin, currentY);

    currentY += 10;
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Analytics Report', margin, currentY);

    // Add metadata
    currentY += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);

    const exportDate = new Date().toLocaleString();
    pdf.text(`Generated: ${exportDate}`, margin, currentY);

    currentY += 5;
    if (dateRange.startDate && dateRange.endDate) {
      const startStr = dateRange.startDate.toLocaleDateString();
      const endStr = dateRange.endDate.toLocaleDateString();
      pdf.text(`Date Range: ${startStr} - ${endStr}`, margin, currentY);
    } else if (dateRange.preset) {
      pdf.text(`Date Range: ${dateRange.preset}`, margin, currentY);
    }

    currentY += 10;

    // Add separator line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    // Capture and add each section
    for (const section of sections.filter(s => s.includeInExport)) {
      const element = document.getElementById(section.elementId);

      if (!element) {
        logger.warn(`Element ${section.elementId} not found, skipping`);
        continue;
      }

      // Add section title
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);

      // Check if we need a new page for the title
      if (currentY > pageHeight - 30) {
        pdf.addPage();
        currentY = margin;
      }

      pdf.text(section.title, margin, currentY);
      currentY += 8;

      // Capture section as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
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

      // Add page break if needed
      if (currentY > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }
    }

    // Add footer to all pages
    const pageCount = pdf.getNumberOfPages();
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      pdf.text('© AIBORG Learn Sphere', pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // Save PDF
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    logger.log(`Analytics PDF exported successfully: ${filename}`);
  } catch (error) {
    logger.error('Error exporting analytics to PDF:', error);
    throw error;
  }
};

/**
 * Export single analytics chart/table to PDF
 * Quick export for individual sections
 * @param elementId Element ID to export
 * @param title Section title
 * @param filename Output filename
 */
export const exportSingleAnalyticsToPDF = async (
  elementId: string,
  title: string,
  filename: string = 'analytics.pdf'
): Promise<void> => {
  const sections: AnalyticsSection[] = [
    {
      title,
      elementId,
      includeInExport: true,
    },
  ];

  const dateRange: DateRange = {
    startDate: null,
    endDate: null,
  };

  return exportAnalyticsToPDF(sections, dateRange, filename);
};

/**
 * Export SME Assessment Report to PDF
 * @param companyName - Name of the company for filename
 * @param assessmentId - Assessment ID for filename
 */
export const exportSMEAssessmentReportToPDF = async (
  companyName: string,
  _assessmentId: string
): Promise<void> => {
  const sanitizedCompanyName = companyName.replace(/[^a-z0-9]/gi, '_');
  const date = new Date().toISOString().split('T')[0];
  const filename = `${sanitizedCompanyName}_AI_Assessment_${date}.pdf`;

  await exportToPDF('sme-assessment-report-content', {
    filename,
    quality: 0.95,
    scale: 2,
  });
};

/**
 * Export Skills Assessment Report to PDF
 * @param userName - Name of the user for filename
 * @param assessmentId - Assessment ID for filename
 */
export const exportSkillsAssessmentToPDF = async (
  userName: string,
  _assessmentId: string
): Promise<void> => {
  const sanitizedUserName = userName.replace(/[^a-z0-9]/gi, '-');
  const date = new Date().toISOString().split('T')[0];
  const filename = `Skills-Assessment-${sanitizedUserName}-${date}.pdf`;

  await exportToPDF('skills-assessment-report-content', {
    filename,
    quality: 0.95,
    scale: 2,
  });
};
