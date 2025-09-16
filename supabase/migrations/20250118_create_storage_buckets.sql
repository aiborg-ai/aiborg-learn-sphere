-- Create storage buckets for LMS content

-- Create bucket for homework submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'homework-submissions',
  'homework-submissions',
  false, -- Private bucket - only authenticated users can access their own files
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create bucket for course materials (videos, documents, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'course-materials',
  'course-materials',
  false, -- Private - only enrolled users can access
  104857600 -- 100MB limit for videos
) ON CONFLICT (id) DO NOTHING;

-- Create bucket for achievement icons
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'achievement-icons',
  'achievement-icons',
  true, -- Public bucket for badge icons
  1048576, -- 1MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Create bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public bucket
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create bucket for certificates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  true, -- Public for sharing
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- RLS Policies for homework-submissions bucket
CREATE POLICY "Users can upload their own homework files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'homework-submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own homework files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'homework-submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own homework files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'homework-submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own homework files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'homework-submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for course-materials bucket
CREATE POLICY "Enrolled users can view course materials"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'course-materials' AND
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.course_materials cm ON cm.course_id = e.course_id
    WHERE e.user_id = auth.uid()
    AND cm.file_url LIKE '%' || storage.filename(name) || '%'
  )
);

CREATE POLICY "Admins can manage course materials"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'course-materials' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies for achievement-icons bucket (public read)
CREATE POLICY "Anyone can view achievement icons"
ON storage.objects
FOR SELECT
USING (bucket_id = 'achievement-icons');

CREATE POLICY "Admins can upload achievement icons"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'achievement-icons' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies for avatars bucket
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for certificates bucket
CREATE POLICY "Anyone can view certificates"
ON storage.objects
FOR SELECT
USING (bucket_id = 'certificates');

CREATE POLICY "System can create certificates"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'certificates' AND
  auth.uid() IS NOT NULL
);