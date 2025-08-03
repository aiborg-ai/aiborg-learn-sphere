-- Create storage buckets for review files
INSERT INTO storage.buckets (id, name, public) VALUES ('review-voices', 'review-voices', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('review-videos', 'review-videos', false);

-- Create policies for review voice storage
CREATE POLICY "Authenticated users can upload voice reviews" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'review-voices' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view voice reviews" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'review-voices');

CREATE POLICY "Users can update their own voice reviews" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'review-voices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own voice reviews" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'review-voices' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policies for review video storage
CREATE POLICY "Authenticated users can upload video reviews" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'review-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view video reviews" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'review-videos');

CREATE POLICY "Users can update their own video reviews" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'review-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own video reviews" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'review-videos' AND auth.uid()::text = (storage.foldername(name))[1]);