-- ============================================================================
-- AI Readiness Benchmark Seed Data
-- Industry and size-based benchmark data for comparative analysis
-- ============================================================================

-- ============================================================================
-- RETAIL INDUSTRY BENCHMARKS
-- ============================================================================

-- Retail: Small (1-50 employees)
INSERT INTO readiness_benchmarks (industry, company_size, dimension, sample_size, avg_score, median_score, std_dev, percentile_25, percentile_50, percentile_75, percentile_90) VALUES
('retail', '1-50', 'overall', 150, 42.5, 41.0, 12.3, 35.0, 41.0, 52.0, 61.0),
('retail', '1-50', 'strategic', 150, 38.0, 37.0, 13.5, 30.0, 37.0, 48.0, 57.0),
('retail', '1-50', 'data', 150, 35.0, 33.0, 11.8, 28.0, 33.0, 43.0, 52.0),
('retail', '1-50', 'tech', 150, 41.0, 40.0, 14.2, 32.0, 40.0, 51.0, 60.0),
('retail', '1-50', 'human', 150, 45.0, 44.0, 12.9, 37.0, 44.0, 54.0, 63.0),
('retail', '1-50', 'process', 150, 48.0, 47.0, 11.5, 40.0, 47.0, 56.0, 65.0),
('retail', '1-50', 'change', 150, 47.0, 46.0, 13.1, 38.0, 46.0, 57.0, 66.0);

-- Retail: Medium (51-200 employees)
INSERT INTO readiness_benchmarks (industry, company_size, dimension, sample_size, avg_score, median_score, std_dev, percentile_25, percentile_50, percentile_75, percentile_90) VALUES
('retail', '51-200', 'overall', 200, 52.0, 51.0, 14.5, 42.0, 51.0, 63.0, 72.0),
('retail', '51-200', 'strategic', 200, 50.0, 49.0, 15.2, 40.0, 49.0, 61.0, 70.0),
('retail', '51-200', 'data', 200, 48.0, 47.0, 13.8, 39.0, 47.0, 58.0, 67.0),
('retail', '51-200', 'tech', 200, 53.0, 52.0, 15.5, 42.0, 52.0, 65.0, 74.0),
('retail', '51-200', 'human', 200, 54.0, 53.0, 14.1, 44.0, 53.0, 65.0, 74.0),
('retail', '51-200', 'process', 200, 55.0, 54.0, 13.3, 46.0, 54.0, 65.0, 73.0),
('retail', '51-200', 'change', 200, 52.0, 51.0, 14.7, 42.0, 51.0, 63.0, 72.0);

-- Retail: Large (201-500 employees)
INSERT INTO readiness_benchmarks (industry, company_size, dimension, sample_size, avg_score, median_score, std_dev, percentile_25, percentile_50, percentile_75, percentile_90) VALUES
('retail', '201-500', 'overall', 120, 62.0, 61.0, 13.2, 53.0, 61.0, 72.0, 80.0),
('retail', '201-500', 'strategic', 120, 61.0, 60.0, 14.1, 52.0, 60.0, 71.0, 79.0),
('retail', '201-500', 'data', 120, 60.0, 59.0, 12.9, 51.0, 59.0, 70.0, 78.0),
('retail', '201-500', 'tech', 120, 64.0, 63.0, 13.8, 55.0, 63.0, 74.0, 82.0),
('retail', '201-500', 'human', 120, 63.0, 62.0, 13.5, 54.0, 62.0, 73.0, 81.0),
('retail', '201-500', 'process', 120, 64.0, 63.0, 12.7, 55.0, 63.0, 74.0, 81.0),
('retail', '201-500', 'change', 120, 61.0, 60.0, 14.0, 52.0, 60.0, 71.0, 79.0);

-- ============================================================================
-- MANUFACTURING INDUSTRY BENCHMARKS
-- ============================================================================

-- Manufacturing: Small (1-50 employees)
INSERT INTO readiness_benchmarks (industry, company_size, dimension, sample_size, avg_score, median_score, std_dev, percentile_25, percentile_50, percentile_75, percentile_90) VALUES
('manufacturing', '1-50', 'overall', 130, 38.0, 37.0, 11.8, 31.0, 37.0, 46.0, 55.0),
('manufacturing', '1-50', 'strategic', 130, 35.0, 34.0, 12.5, 28.0, 34.0, 44.0, 52.0),
('manufacturing', '1-50', 'data', 130, 32.0, 31.0, 10.9, 26.0, 31.0, 39.0, 47.0),
('manufacturing', '1-50', 'tech', 130, 40.0, 39.0, 13.1, 32.0, 39.0, 49.0, 57.0),
('manufacturing', '1-50', 'human', 130, 39.0, 38.0, 11.7, 32.0, 38.0, 47.0, 55.0),
('manufacturing', '1-50', 'process', 130, 42.0, 41.0, 12.3, 34.0, 41.0, 51.0, 59.0),
('manufacturing', '1-50', 'change', 130, 40.0, 39.0, 12.8, 32.0, 39.0, 49.0, 57.0);

-- Manufacturing: Medium (51-200 employees)
INSERT INTO readiness_benchmarks (industry, company_size, dimension, sample_size, avg_score, median_score, std_dev, percentile_25, percentile_50, percentile_75, percentile_90) VALUES
('manufacturing', '51-200', 'overall', 180, 48.0, 47.0, 13.5, 39.0, 47.0, 58.0, 67.0),
('manufacturing', '51-200', 'strategic', 180, 46.0, 45.0, 14.2, 37.0, 45.0, 56.0, 65.0),
('manufacturing', '51-200', 'data', 180, 44.0, 43.0, 12.8, 36.0, 43.0, 53.0, 62.0),
('manufacturing', '51-200', 'tech', 180, 51.0, 50.0, 14.5, 41.0, 50.0, 62.0, 71.0),
('manufacturing', '51-200', 'human', 180, 48.0, 47.0, 13.1, 39.0, 47.0, 58.0, 66.0),
('manufacturing', '51-200', 'process', 180, 52.0, 51.0, 13.8, 43.0, 51.0, 62.0, 70.0),
('manufacturing', '51-200', 'change', 180, 47.0, 46.0, 13.9, 38.0, 46.0, 57.0, 65.0);

-- Manufacturing: Large (201-500 employees)
INSERT INTO readiness_benchmarks (industry, company_size, dimension, sample_size, avg_score, median_score, std_dev, percentile_25, percentile_50, percentile_75, percentile_90) VALUES
('manufacturing', '201-500', 'overall', 140, 58.0, 57.0, 12.9, 49.0, 57.0, 68.0, 76.0),
('manufacturing', '201-500', 'strategic', 140, 57.0, 56.0, 13.7, 48.0, 56.0, 67.0, 75.0),
('manufacturing', '201-500', 'data', 140, 56.0, 55.0, 12.3, 48.0, 55.0, 65.0, 73.0),
('manufacturing', '201-500', 'tech', 140, 61.0, 60.0, 13.5, 52.0, 60.0, 71.0, 79.0),
('manufacturing', '201-500', 'human', 140, 58.0, 57.0, 12.8, 50.0, 57.0, 67.0, 75.0),
('manufacturing', '201-500', 'process', 140, 62.0, 61.0, 12.1, 54.0, 61.0, 71.0, 78.0),
('manufacturing', '201-500', 'change', 140, 56.0, 55.0, 13.4, 47.0, 55.0, 66.0, 74.0);

-- ============================================================================
-- PROFESSIONAL SERVICES BENCHMARKS
-- ============================================================================

-- Professional Services: Small (1-50 employees)
INSERT INTO readiness_benchmarks (industry, company_size, dimension, sample_size, avg_score, median_score, std_dev, percentile_25, percentile_50, percentile_75, percentile_90) VALUES
('professional_services', '1-50', 'overall', 170, 45.0, 44.0, 13.1, 37.0, 44.0, 54.0, 63.0),
('professional_services', '1-50', 'strategic', 170, 42.0, 41.0, 13.8, 34.0, 41.0, 51.0, 60.0),
('professional_services', '1-50', 'data', 170, 40.0, 39.0, 12.5, 33.0, 39.0, 48.0, 57.0),
('professional_services', '1-50', 'tech', 170, 46.0, 45.0, 14.2, 37.0, 45.0, 56.0, 65.0),
('professional_services', '1-50', 'human', 170, 50.0, 49.0, 13.3, 41.0, 49.0, 60.0, 68.0),
('professional_services', '1-50', 'process', 170, 46.0, 45.0, 12.7, 38.0, 45.0, 55.0, 63.0),
('professional_services', '1-50', 'change', 170, 48.0, 47.0, 13.5, 39.0, 47.0, 58.0, 66.0);

-- Professional Services: Medium (51-200 employees)
INSERT INTO readiness_benchmarks (industry, company_size, dimension, sample_size, avg_score, median_score, std_dev, percentile_25, percentile_50, percentile_75, percentile_90) VALUES
('professional_services', '51-200', 'overall', 190, 55.0, 54.0, 14.2, 45.0, 54.0, 66.0, 75.0),
('professional_services', '51-200', 'strategic', 190, 53.0, 52.0, 14.9, 43.0, 52.0, 64.0, 73.0),
('professional_services', '51-200', 'data', 190, 51.0, 50.0, 13.6, 42.0, 50.0, 61.0, 70.0),
('professional_services', '51-200', 'tech', 190, 57.0, 56.0, 15.1, 46.0, 56.0, 69.0, 78.0),
('professional_services', '51-200', 'human', 190, 59.0, 58.0, 14.4, 49.0, 58.0, 70.0, 78.0),
('professional_services', '51-200', 'process', 190, 54.0, 53.0, 13.9, 45.0, 53.0, 64.0, 72.0),
('professional_services', '51-200', 'change', 190, 56.0, 55.0, 14.5, 46.0, 55.0, 67.0, 75.0);

-- ============================================================================
-- TECHNOLOGY/SOFTWARE BENCHMARKS
-- ============================================================================

-- Technology: Small (1-50 employees)
INSERT INTO readiness_benchmarks (industry, company_size, dimension, sample_size, avg_score, median_score, std_dev, percentile_25, percentile_50, percentile_75, percentile_90) VALUES
('technology', '1-50', 'overall', 210, 58.0, 57.0, 15.2, 47.0, 57.0, 70.0, 80.0),
('technology', '1-50', 'strategic', 210, 55.0, 54.0, 15.8, 44.0, 54.0, 67.0, 77.0),
('technology', '1-50', 'data', 210, 54.0, 53.0, 14.5, 44.0, 53.0, 65.0, 75.0),
('technology', '1-50', 'tech', 210, 68.0, 67.0, 16.1, 56.0, 67.0, 81.0, 90.0),
('technology', '1-50', 'human', 210, 61.0, 60.0, 15.3, 50.0, 60.0, 73.0, 82.0),
('technology', '1-50', 'process', 210, 56.0, 55.0, 14.7, 46.0, 55.0, 67.0, 76.0),
('technology', '1-50', 'change', 210, 60.0, 59.0, 15.5, 49.0, 59.0, 72.0, 81.0);

-- Technology: Medium (51-200 employees)
INSERT INTO readiness_benchmarks (industry, company_size, dimension, sample_size, avg_score, median_score, std_dev, percentile_25, percentile_50, percentile_75, percentile_90) VALUES
('technology', '51-200', 'overall', 180, 68.0, 67.0, 13.8, 58.0, 67.0, 79.0, 87.0),
('technology', '51-200', 'strategic', 180, 66.0, 65.0, 14.5, 56.0, 65.0, 77.0, 85.0),
('technology', '51-200', 'data', 180, 65.0, 64.0, 13.2, 56.0, 64.0, 75.0, 83.0),
('technology', '51-200', 'tech', 180, 76.0, 75.0, 14.8, 66.0, 75.0, 87.0, 94.0),
('technology', '51-200', 'human', 180, 70.0, 69.0, 13.9, 60.0, 69.0, 81.0, 88.0),
('technology', '51-200', 'process', 180, 66.0, 65.0, 13.5, 57.0, 65.0, 76.0, 84.0),
('technology', '51-200', 'change', 180, 68.0, 67.0, 14.2, 58.0, 67.0, 79.0, 86.0);

-- ============================================================================
-- HEALTHCARE BENCHMARKS
-- ============================================================================

-- Healthcare: Small (1-50 employees)
INSERT INTO readiness_benchmarks (industry, company_size, dimension, sample_size, avg_score, median_score, std_dev, percentile_25, percentile_50, percentile_75, percentile_90) VALUES
('healthcare', '1-50', 'overall', 140, 40.0, 39.0, 12.5, 32.0, 39.0, 49.0, 58.0),
('healthcare', '1-50', 'strategic', 140, 38.0, 37.0, 13.1, 30.0, 37.0, 47.0, 56.0),
('healthcare', '1-50', 'data', 140, 36.0, 35.0, 11.8, 29.0, 35.0, 44.0, 52.0),
('healthcare', '1-50', 'tech', 140, 41.0, 40.0, 13.5, 33.0, 40.0, 50.0, 59.0),
('healthcare', '1-50', 'human', 140, 42.0, 41.0, 12.7, 34.0, 41.0, 51.0, 59.0),
('healthcare', '1-50', 'process', 140, 44.0, 43.0, 12.2, 36.0, 43.0, 53.0, 61.0),
('healthcare', '1-50', 'change', 140, 39.0, 38.0, 13.3, 31.0, 38.0, 48.0, 56.0);

-- Healthcare: Medium (51-200 employees)
INSERT INTO readiness_benchmarks (industry, company_size, dimension, sample_size, avg_score, median_score, std_dev, percentile_25, percentile_50, percentile_75, percentile_90) VALUES
('healthcare', '51-200', 'overall', 160, 50.0, 49.0, 13.9, 41.0, 49.0, 60.0, 69.0),
('healthcare', '51-200', 'strategic', 160, 48.0, 47.0, 14.6, 39.0, 47.0, 58.0, 67.0),
('healthcare', '51-200', 'data', 160, 46.0, 45.0, 13.2, 38.0, 45.0, 55.0, 64.0),
('healthcare', '51-200', 'tech', 160, 52.0, 51.0, 14.8, 42.0, 51.0, 63.0, 72.0),
('healthcare', '51-200', 'human', 160, 51.0, 50.0, 13.7, 42.0, 50.0, 61.0, 69.0),
('healthcare', '51-200', 'process', 160, 54.0, 53.0, 13.1, 45.0, 53.0, 64.0, 71.0),
('healthcare', '51-200', 'change', 160, 49.0, 48.0, 14.3, 40.0, 48.0, 59.0, 67.0);

-- ============================================================================
-- FINANCIAL SERVICES BENCHMARKS
-- ============================================================================

-- Financial Services: Small (1-50 employees)
INSERT INTO readiness_benchmarks (industry, company_size, dimension, sample_size, avg_score, median_score, std_dev, percentile_25, percentile_50, percentile_75, percentile_90) VALUES
('financial_services', '1-50', 'overall', 130, 48.0, 47.0, 13.8, 39.0, 47.0, 58.0, 67.0),
('financial_services', '1-50', 'strategic', 130, 46.0, 45.0, 14.5, 37.0, 45.0, 56.0, 65.0),
('financial_services', '1-50', 'data', 130, 44.0, 43.0, 13.1, 36.0, 43.0, 53.0, 62.0),
('financial_services', '1-50', 'tech', 130, 50.0, 49.0, 15.2, 40.0, 49.0, 61.0, 70.0),
('financial_services', '1-50', 'human', 130, 49.0, 48.0, 13.9, 40.0, 48.0, 59.0, 67.0),
('financial_services', '1-50', 'process', 130, 52.0, 51.0, 13.5, 43.0, 51.0, 62.0, 70.0),
('financial_services', '1-50', 'change', 130, 47.0, 46.0, 14.1, 38.0, 46.0, 57.0, 65.0);

-- Financial Services: Medium (51-200 employees)
INSERT INTO readiness_benchmarks (industry, company_size, dimension, sample_size, avg_score, median_score, std_dev, percentile_25, percentile_50, percentile_75, percentile_90) VALUES
('financial_services', '51-200', 'overall', 150, 60.0, 59.0, 14.5, 50.0, 59.0, 71.0, 80.0),
('financial_services', '51-200', 'strategic', 150, 58.0, 57.0, 15.2, 48.0, 57.0, 69.0, 78.0),
('financial_services', '51-200', 'data', 150, 57.0, 56.0, 13.8, 48.0, 56.0, 67.0, 76.0),
('financial_services', '51-200', 'tech', 150, 63.0, 62.0, 15.5, 52.0, 62.0, 75.0, 84.0),
('financial_services', '51-200', 'human', 150, 61.0, 60.0, 14.2, 51.0, 60.0, 72.0, 80.0),
('financial_services', '51-200', 'process', 150, 64.0, 63.0, 13.9, 54.0, 63.0, 75.0, 82.0),
('financial_services', '51-200', 'change', 150, 59.0, 58.0, 14.8, 49.0, 58.0, 70.0, 78.0);

-- ============================================================================
-- Update last_updated timestamp
-- ============================================================================
UPDATE readiness_benchmarks SET last_updated = NOW();
