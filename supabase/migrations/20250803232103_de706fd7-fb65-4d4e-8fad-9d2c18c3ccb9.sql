-- Add foreign key constraint between reviews and profiles
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint between reviews and courses  
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_course_id FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL;