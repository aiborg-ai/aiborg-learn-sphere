-- Update AI Team Training Program price to £5100
-- This migration updates the price for the AI Team Training Program course

UPDATE courses
SET price = '£5,100'
WHERE title = 'AI Team Training Program';
