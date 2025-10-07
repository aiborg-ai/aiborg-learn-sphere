import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { logger } from './logger';

interface PDFExportOptions {
  filename?: string;
  quality?: number;
  scale?: number;
}

/**
 * Export an HTML element to PDF
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
