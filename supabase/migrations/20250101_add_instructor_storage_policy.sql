-- Add instructor upload permissions for course-materials bucket

CREATE POLICY "Instructors can upload course materials"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'course-materials' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('instructor', 'admin', 'super_admin')
    AND is_active = true
  )
);

CREATE POLICY "Instructors can update course materials"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'course-materials' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('instructor', 'admin', 'super_admin')
    AND is_active = true
  )
);

CREATE POLICY "Instructors can delete course materials"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'course-materials' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('instructor', 'admin', 'super_admin')
    AND is_active = true
  )
);
