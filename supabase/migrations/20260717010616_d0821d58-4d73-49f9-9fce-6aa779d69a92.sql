
CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  city_zip text NOT NULL,
  message text,
  photo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin and karebear read contact messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'karebear'::app_role));

-- Storage: allow anon uploads to contact-photos bucket, public read
CREATE POLICY "Anyone can upload contact photos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'contact-photos');

CREATE POLICY "Public read contact photos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'contact-photos');
