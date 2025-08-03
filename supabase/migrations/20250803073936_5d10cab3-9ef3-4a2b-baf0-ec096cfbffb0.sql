-- Remove all courses with numbers in their titles
DELETE FROM courses WHERE title ~ '[0-9]';