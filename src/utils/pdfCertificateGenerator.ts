/**
 * PDF Certificate Generator
 *
 * Generates professional PDF certificates with:
 * - Custom branding
 * - QR code for verification
 * - Digital signature placeholder
 */

import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface CertificateData {
  userName: string;
  courseTitle: string;
  issueDate: string;
  verificationCode: string;
  organizationName?: string;
  signatoryName?: string;
  signatoryTitle?: string;
}

export async function generateCertificatePDF(data: CertificateData): Promise<Blob> {
  const {
    userName,
    courseTitle,
    issueDate,
    verificationCode,
    organizationName = 'AiBorg Learning',
    signatoryName = 'Certificate Authority',
    signatoryTitle = 'Director of Education',
  } = data;

  // Create PDF in landscape A4 format (297mm x 210mm)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Add decorative border
  pdf.setDrawColor(41, 128, 185); // Blue color
  pdf.setLineWidth(2);
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
  pdf.setLineWidth(0.5);
  pdf.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Add header section with organization name
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text(organizationName, pageWidth / 2, 25, { align: 'center' });

  // Add "Certificate of Completion" title
  pdf.setFontSize(36);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(41, 128, 185); // Blue color
  pdf.text('Certificate of Completion', pageWidth / 2, 50, { align: 'center' });

  // Add decorative line under title
  pdf.setDrawColor(41, 128, 185);
  pdf.setLineWidth(0.5);
  pdf.line(pageWidth / 2 - 60, 55, pageWidth / 2 + 60, 55);

  // Add "This is to certify that" text
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80, 80, 80);
  pdf.text('This is to certify that', pageWidth / 2, 70, { align: 'center' });

  // Add recipient name
  pdf.setFontSize(28);
  pdf.setFont('times', 'bold');
  pdf.setTextColor(41, 128, 185); // Blue color
  pdf.text(userName, pageWidth / 2, 85, { align: 'center' });

  // Add decorative line under name
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.3);
  pdf.line(pageWidth / 2 - 70, 88, pageWidth / 2 + 70, 88);

  // Add completion text
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80, 80, 80);
  pdf.text('has successfully completed the course', pageWidth / 2, 100, { align: 'center' });

  // Add course title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(60, 60, 60);
  pdf.text(courseTitle, pageWidth / 2, 115, { align: 'center' });

  // Add issue date
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Issued on: ${issueDate}`, pageWidth / 2, 130, { align: 'center' });

  // Add signature section
  const signatureY = 155;

  // Left signature (Signatory)
  pdf.setLineWidth(0.3);
  pdf.line(40, signatureY, 90, signatureY);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(60, 60, 60);
  pdf.text(signatoryName, 65, signatureY + 7, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text(signatoryTitle, 65, signatureY + 12, { align: 'center' });

  // Right section - QR Code for verification
  try {
    const verificationUrl = `https://aiborg-ai-web.vercel.app/verify/${verificationCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      width: 200,
      margin: 1,
    });

    // Add QR code
    const qrSize = 30;
    pdf.addImage(qrCodeDataUrl, 'PNG', pageWidth - 60, signatureY - 15, qrSize, qrSize);

    // Add verification text
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Scan to verify', pageWidth - 45, signatureY + 20, { align: 'center' });
    pdf.setFontSize(7);
    pdf.text(verificationCode, pageWidth - 45, signatureY + 24, { align: 'center' });
  } catch {
    // QR code generation failed - certificate will still be valid without it
  }

  // Add footer with verification code
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Certificate ID: ${verificationCode}`, pageWidth / 2, pageHeight - 15, {
    align: 'center',
  });

  // Add watermark
  pdf.setFontSize(60);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(240, 240, 240);
  pdf.text('CERTIFIED', pageWidth / 2, pageHeight / 2 + 10, {
    align: 'center',
    angle: 45,
  });

  // Convert to blob
  return pdf.output('blob');
}

/**
 * Generate a simple certificate preview (for quick viewing without full generation)
 */
export function generateCertificatePreview(data: CertificateData): string {
  // Return a data URL for quick preview
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = '#2980b9';
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Title
  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = '#2980b9';
  ctx.textAlign = 'center';
  ctx.fillText('Certificate of Completion', canvas.width / 2, 120);

  // User name
  ctx.font = 'bold 36px Times New Roman';
  ctx.fillStyle = '#2980b9';
  ctx.fillText(data.userName, canvas.width / 2, 250);

  // Course title
  ctx.font = '24px Arial';
  ctx.fillStyle = '#333333';
  ctx.fillText(data.courseTitle, canvas.width / 2, 320);

  // Date
  ctx.font = '18px Arial';
  ctx.fillStyle = '#666666';
  ctx.fillText(`Issued: ${data.issueDate}`, canvas.width / 2, 380);

  // Verification code
  ctx.font = '14px Arial';
  ctx.fillStyle = '#999999';
  ctx.fillText(`Verification: ${data.verificationCode}`, canvas.width / 2, 550);

  return canvas.toDataURL('image/png');
}
