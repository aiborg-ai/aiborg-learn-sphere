import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CertificateService } from '../CertificateService';
import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

// Mock QRCode library
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(),
  },
}));

// Mock global fetch
global.fetch = vi.fn();

describe('CertificateService', () => {
  const mockUserId = 'user-123';
  const mockCertificate = {
    id: 'cert-123',
    user_id: mockUserId,
    certificate_type: 'course_completion',
    reference_id: 'course-456',
    title: 'AI Fundamentals Certificate',
    description: 'Completed AI Fundamentals course',
    verification_code: 'ABC123XYZ',
    issued_date: '2024-01-01',
    expires_at: null,
    qr_code_url: null,
    pdf_url: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fetch for QR code blob conversion
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      blob: vi.fn().mockResolvedValue(new Blob(['mock-qr-code'], { type: 'image/png' })),
    });

    // Mock QRCode generation
    (QRCode.toDataURL as ReturnType<typeof vi.fn>).mockResolvedValue(
      'data:image/png;base64,mockQRCode'
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generate', () => {
    it('should generate certificate with QR code', async () => {
      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          // Insert certificate
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockCertificate,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          // Update with QR code URL
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    ...mockCertificate,
                    qr_code_url: 'https://example.com/qr-code.png',
                  },
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          // Update with PDF URL
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: {},
              error: null,
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      // Mock storage operations
      const mockStorage = {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
          getPublicUrl: vi.fn().mockReturnValue({
            data: { publicUrl: 'https://example.com/qr-code.png' },
          }),
        })),
      };

      (supabase.storage as typeof mockStorage) = mockStorage;

      // Mock generatePDF
      const generatePDFSpy = vi
        .spyOn(CertificateService as any, 'generatePDF')
        .mockResolvedValue('https://example.com/certificate.pdf');

      const result = await CertificateService.generate(
        mockUserId,
        'course_completion',
        'course-456',
        'AI Fundamentals Certificate',
        'Completed AI Fundamentals course',
        365
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('cert-123');
      expect(result.qr_code_url).toBe('https://example.com/qr-code.png');
      expect(result.pdf_url).toBe('https://example.com/certificate.pdf');
      expect(QRCode.toDataURL).toHaveBeenCalled();
      expect(generatePDFSpy).toHaveBeenCalled();
    });

    it('should generate certificate without expiration', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockCertificate, expires_at: null },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockCertificate,
                error: null,
              }),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const mockStorage = {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
          getPublicUrl: vi.fn().mockReturnValue({
            data: { publicUrl: 'https://example.com/qr-code.png' },
          }),
        })),
      };

      (supabase.storage as typeof mockStorage) = mockStorage;

      vi.spyOn(CertificateService as any, 'generatePDF').mockResolvedValue(
        'https://example.com/certificate.pdf'
      );

      const result = await CertificateService.generate(
        mockUserId,
        'course_completion',
        'course-456',
        'Test Certificate'
      );

      expect(result.expires_at).toBeNull();
    });

    it('should handle certificate creation errors', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(
        CertificateService.generate(
          mockUserId,
          'course_completion',
          'course-456',
          'Test Certificate'
        )
      ).rejects.toThrow();
    });

    it('should handle QR code upload errors', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCertificate,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const mockStorage = {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Upload failed' },
          }),
        })),
      };

      (supabase.storage as typeof mockStorage) = mockStorage;

      await expect(
        CertificateService.generate(
          mockUserId,
          'course_completion',
          'course-456',
          'Test Certificate'
        )
      ).rejects.toThrow();
    });
  });

  describe('verify', () => {
    it('should verify certificate by verification code', async () => {
      const mockVerificationData = {
        certificate_id: 'cert-123',
        user_name: 'John Doe',
        certificate_title: 'AI Fundamentals',
        issued_date: '2024-01-01',
        verification_code: 'ABC123XYZ',
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: { id: 'verification-123' },
          error: null,
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [mockVerificationData],
        error: null,
      });

      const result = await CertificateService.verify('ABC123XYZ');

      expect(result).toBeDefined();
      expect(result).toEqual(mockVerificationData);
      expect(supabase.rpc).toHaveBeenCalledWith('verify_certificate', {
        verification_code_input: 'ABC123XYZ',
      });
    });

    it('should return null for invalid verification code', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await CertificateService.verify('INVALID');

      expect(result).toBeNull();
    });

    it('should handle verification errors', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      });

      await expect(CertificateService.verify('ABC123XYZ')).rejects.toThrow();
    });

    it('should log verification in database', async () => {
      const mockVerificationData = {
        certificate_id: 'cert-123',
        user_name: 'John Doe',
      };

      const insertMock = vi.fn().mockResolvedValue({
        data: { id: 'log-123' },
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        insert: insertMock,
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [mockVerificationData],
        error: null,
      });

      await CertificateService.verify('ABC123XYZ');

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          certificate_id: 'cert-123',
          verification_method: 'verification_code',
        })
      );
    });
  });

  describe('getUserCertificates', () => {
    it('should retrieve user certificates', async () => {
      const mockCertificates = [
        mockCertificate,
        { ...mockCertificate, id: 'cert-124', title: 'Another Certificate' },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockCertificates,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await CertificateService.getUserCertificates(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('cert-123');
      expect(result[1]?.id).toBe('cert-124');
    });

    it('should return empty array when user has no certificates', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await CertificateService.getUserCertificates(mockUserId);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(CertificateService.getUserCertificates(mockUserId)).rejects.toThrow();
    });

    it('should order certificates by issued date descending', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: [mockCertificate],
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: orderMock,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await CertificateService.getUserCertificates(mockUserId);

      expect(orderMock).toHaveBeenCalledWith('issued_date', { ascending: false });
    });
  });

  describe('QR code generation', () => {
    it('should generate QR code with correct URL', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCertificate,
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockCertificate,
                error: null,
              }),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const mockStorage = {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
          getPublicUrl: vi.fn().mockReturnValue({
            data: { publicUrl: 'https://example.com/qr-code.png' },
          }),
        })),
      };

      (supabase.storage as typeof mockStorage) = mockStorage;

      vi.spyOn(CertificateService as any, 'generatePDF').mockResolvedValue(
        'https://example.com/certificate.pdf'
      );

      await CertificateService.generate(
        mockUserId,
        'course_completion',
        'course-456',
        'Test Certificate'
      );

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        expect.stringContaining('https://aiborg-ai-web.vercel.app/verify/'),
        expect.objectContaining({
          errorCorrectionLevel: 'H',
          width: 300,
          margin: 2,
        })
      );
    });
  });
});
