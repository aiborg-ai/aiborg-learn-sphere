/**
 * Certificate Service
 * Handles PDF certificates, QR code generation, and verification
 */

import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';
import type { Certificate } from './types';

export class CertificateService {
  private static readonly VERIFICATION_BASE_URL = 'https://aiborg-ai-web.vercel.app/verify';

  /**
   * Generate certificate with QR code
   */
  static async generate(
    userId: string,
    type: string,
    referenceId: string,
    title: string,
    description?: string,
    expiresInDays?: number
  ): Promise<Certificate> {
    // Create certificate record
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const { data: certificate, error } = await supabase
      .from('certificates')
      .insert({
        user_id: userId,
        certificate_type: type,
        reference_id: referenceId,
        title,
        description,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;

    // Generate QR code
    const verificationUrl = `${this.VERIFICATION_BASE_URL}/${certificate.verification_code}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
    });

    // Upload QR code to storage
    const qrCodeBlob = await fetch(qrCodeDataUrl).then((r) => r.blob());
    const qrPath = `certificates/${certificate.id}/qr-code.png`;

    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(qrPath, qrCodeBlob, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: qrUrl } = supabase.storage.from('certificates').getPublicUrl(qrPath);

    // Update certificate with QR code URL
    const { data: updatedCert, error: updateError } = await supabase
      .from('certificates')
      .update({ qr_code_url: qrUrl.publicUrl })
      .eq('id', certificate.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Generate PDF certificate
    const pdfUrl = await this.generatePDF(updatedCert);

    // Update with PDF URL
    await supabase.from('certificates').update({ pdf_url: pdfUrl }).eq('id', certificate.id);

    return { ...updatedCert, pdf_url: pdfUrl };
  }

  /**
   * Verify certificate by verification code
   */
  static async verify(verificationCode: string): Promise<unknown> {
    const { data, error } = await supabase.rpc('verify_certificate', {
      verification_code_input: verificationCode,
    });

    if (error) throw error;

    // Log verification
    if (data && data.length > 0) {
      await supabase.from('certificate_verifications').insert({
        certificate_id: data[0].certificate_id,
        verification_method: 'verification_code',
      });
    }

    return data?.[0] || null;
  }

  /**
   * Get user certificates
   */
  static async getUserCertificates(userId: string): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .order('issued_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Generate PDF certificate (placeholder - would use actual PDF library)
   */
  private static async generatePDF(certificate: unknown): Promise<string> {
    const cert = certificate as { id: string };
    // In production, use jsPDF, puppeteer, or a PDF generation service
    // For now, return a placeholder
    return `https://example.com/certificates/${cert.id}.pdf`;
  }
}
