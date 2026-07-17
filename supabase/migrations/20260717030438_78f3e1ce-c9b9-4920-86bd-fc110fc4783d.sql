
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS photo_path text;

CREATE POLICY "Anyone can upload booking photos"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'booking-photos');

CREATE POLICY "Staff can read booking photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'booking-photos'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'karebear'::app_role))
);
