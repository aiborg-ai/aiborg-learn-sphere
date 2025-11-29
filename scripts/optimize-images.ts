/**
 * Image Optimization Script
 *
 * Converts PNG/JPG images to WebP format and generates responsive variants
 * Reduces image sizes by 60-80% while maintaining quality
 *
 * Usage: npm run optimize:images
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ImageOptimizationConfig {
  inputDir: string;
  outputDir: string;
  formats: ('webp' | 'avif' | 'original')[];
  sizes: { name: string; width: number }[];
  quality: {
    webp: number;
    avif: number;
    jpeg: number;
    png: number;
  };
}

const config: ImageOptimizationConfig = {
  inputDir: path.join(__dirname, '../public/lovable-uploads'),
  outputDir: path.join(__dirname, '../public/lovable-uploads'),
  formats: ['webp', 'original'], // Add 'avif' for even better compression
  sizes: [
    { name: 'small', width: 640 },
    { name: 'medium', width: 1024 },
    { name: 'large', width: 1920 },
  ],
  quality: {
    webp: 85,
    avif: 80,
    jpeg: 85,
    png: 90,
  },
};

/**
 * Get file size in human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if image should be optimized (only large images > 500KB)
 */
async function shouldOptimize(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size > 500 * 1024; // Only optimize files > 500KB
  } catch {
    return false;
  }
}

/**
 * Optimize a single image
 */
async function optimizeImage(inputPath: string, filename: string): Promise<void> {
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext);
  const originalFormat = ext.slice(1).toLowerCase();

  console.log(`\n📸 Optimizing: ${filename}`);

  // Get original file size
  const originalStats = await fs.stat(inputPath);
  const originalSize = originalStats.size;
  console.log(`   Original size: ${formatBytes(originalSize)}`);

  // Load the image
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  let totalSaved = 0;

  // Generate WebP version
  if (config.formats.includes('webp')) {
    const webpPath = path.join(config.outputDir, `${nameWithoutExt}.webp`);

    await image
      .webp({ quality: config.quality.webp, effort: 6 })
      .toFile(webpPath);

    const webpStats = await fs.stat(webpPath);
    const webpSize = webpStats.size;
    const webpSaved = originalSize - webpSize;
    totalSaved += webpSaved;

    console.log(`   ✓ WebP: ${formatBytes(webpSize)} (saved ${formatBytes(webpSaved)} / ${Math.round((webpSaved / originalSize) * 100)}%)`);
  }

  // Generate AVIF version (even better compression)
  if (config.formats.includes('avif')) {
    const avifPath = path.join(config.outputDir, `${nameWithoutExt}.avif`);

    await image
      .avif({ quality: config.quality.avif, effort: 6 })
      .toFile(avifPath);

    const avifStats = await fs.stat(avifPath);
    const avifSize = avifStats.size;
    const avifSaved = originalSize - avifSize;

    console.log(`   ✓ AVIF: ${formatBytes(avifSize)} (saved ${formatBytes(avifSaved)} / ${Math.round((avifSaved / originalSize) * 100)}%)`);
  }

  // Generate responsive variants for WebP
  if (metadata.width && metadata.width > 640) {
    console.log(`   Generating responsive variants...`);

    for (const size of config.sizes) {
      if (size.width >= metadata.width) continue; // Skip if size is larger than original

      const responsiveWebPPath = path.join(
        config.outputDir,
        `${nameWithoutExt}-${size.name}.webp`
      );

      await sharp(inputPath)
        .resize(size.width, null, { withoutEnlargement: true })
        .webp({ quality: config.quality.webp, effort: 6 })
        .toFile(responsiveWebPPath);

      const stats = await fs.stat(responsiveWebPPath);
      console.log(`   ✓ ${size.name} (${size.width}w): ${formatBytes(stats.size)}`);
    }
  }

  // Optimize original format if keeping it
  if (config.formats.includes('original')) {
    const optimizedPath = path.join(config.outputDir, `${nameWithoutExt}-optimized${ext}`);

    if (originalFormat === 'png') {
      await sharp(inputPath)
        .png({ quality: config.quality.png, compressionLevel: 9, effort: 10 })
        .toFile(optimizedPath);
    } else if (originalFormat === 'jpg' || originalFormat === 'jpeg') {
      await sharp(inputPath)
        .jpeg({ quality: config.quality.jpeg, progressive: true, mozjpeg: true })
        .toFile(optimizedPath);
    }

    const optimizedStats = await fs.stat(optimizedPath);
    const optimizedSize = optimizedStats.size;
    const optimizedSaved = originalSize - optimizedSize;
    totalSaved += optimizedSaved;

    console.log(`   ✓ Optimized ${ext.toUpperCase()}: ${formatBytes(optimizedSize)} (saved ${formatBytes(optimizedSaved)} / ${Math.round((optimizedSaved / originalSize) * 100)}%)`);
  }

  console.log(`   💾 Total savings: ${formatBytes(totalSaved)} (${Math.round((totalSaved / originalSize) * 100)}%)`);
}

/**
 * Main function to optimize all images in directory
 */
async function main() {
  console.log('🚀 Starting image optimization...\n');
  console.log(`Input directory: ${config.inputDir}`);
  console.log(`Output directory: ${config.outputDir}`);
  console.log(`Formats: ${config.formats.join(', ')}`);
  console.log(`Sizes: ${config.sizes.map((s) => `${s.name} (${s.width}w)`).join(', ')}`);

  // Read all files in input directory
  const files = await fs.readdir(config.inputDir);

  // Filter for image files
  const imageFiles = files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ['.png', '.jpg', '.jpeg'].includes(ext);
  });

  console.log(`\nFound ${imageFiles.length} images to process\n`);

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let processedCount = 0;

  // Process each image
  for (const file of imageFiles) {
    const inputPath = path.join(config.inputDir, file);

    // Check if image should be optimized
    if (!(await shouldOptimize(inputPath))) {
      console.log(`⏭️  Skipping ${file} (already optimized or too small)`);
      continue;
    }

    try {
      const beforeSize = (await fs.stat(inputPath)).size;
      totalOriginalSize += beforeSize;

      await optimizeImage(inputPath, file);

      // Calculate total size of optimized versions
      const nameWithoutExt = path.basename(file, path.extname(file));
      const webpPath = path.join(config.outputDir, `${nameWithoutExt}.webp`);
      if (await fs.access(webpPath).then(() => true).catch(() => false)) {
        const afterSize = (await fs.stat(webpPath)).size;
        totalOptimizedSize += afterSize;
      }

      processedCount++;
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Optimization Summary');
  console.log('='.repeat(60));
  console.log(`Images processed: ${processedCount}`);
  console.log(`Original total size: ${formatBytes(totalOriginalSize)}`);
  console.log(`WebP total size: ${formatBytes(totalOptimizedSize)}`);
  console.log(`Total saved: ${formatBytes(totalOriginalSize - totalOptimizedSize)}`);
  console.log(`Reduction: ${Math.round(((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100)}%`);
  console.log('='.repeat(60));

  console.log('\n✅ Image optimization complete!');
  console.log('\n💡 Next steps:');
  console.log('   1. Update image references to use .webp extension');
  console.log('   2. Use the OptimizedImage component for automatic format selection');
  console.log('   3. Consider backing up original files before deleting them');
}

// Run the script
main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
