-- Create PhotoBank Projects table
CREATE TABLE IF NOT EXISTS public.photobank_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  main_event_name TEXT NOT NULL,
  main_event_description TEXT NOT NULL,
  short_description TEXT NOT NULL,
  sub_event_name TEXT NOT NULL,
  custom_sub_event_name TEXT,
  thumbnail_image_id UUID REFERENCES public.photobank_project_thumbnail_images(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create PhotoBank Project Thumbnail Images table
CREATE TABLE IF NOT EXISTS public.photobank_project_thumbnail_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.photobank_projects(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id) -- One thumbnail per project
);

-- Create PhotoBank Albums table
CREATE TABLE IF NOT EXISTS public.photobank_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.photobank_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  main_event_name TEXT NOT NULL,
  main_event_description TEXT NOT NULL,
  short_description TEXT NOT NULL,
  sub_event_name TEXT NOT NULL,
  custom_sub_event_name TEXT,
  thumbnail_image_id UUID REFERENCES public.photobank_album_thumbnail_images(id) ON DELETE SET NULL,
  is_new_project_album BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create PhotoBank Album Thumbnail Images table
CREATE TABLE IF NOT EXISTS public.photobank_album_thumbnail_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.photobank_albums(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(album_id) -- One thumbnail per album
);

-- Create PhotoBank Album Images table
CREATE TABLE IF NOT EXISTS public.photobank_album_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.photobank_albums(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.photobank_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photobank_project_thumbnail_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photobank_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photobank_album_thumbnail_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photobank_album_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for photobank_projects
CREATE POLICY "Users can view their own PhotoBank projects" 
  ON public.photobank_projects 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PhotoBank projects" 
  ON public.photobank_projects 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PhotoBank projects" 
  ON public.photobank_projects 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PhotoBank projects" 
  ON public.photobank_projects 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for photobank_project_thumbnail_images
CREATE POLICY "Users can view their own project thumbnails" 
  ON public.photobank_project_thumbnail_images 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.photobank_projects 
      WHERE id = photobank_project_thumbnail_images.project_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own project thumbnails" 
  ON public.photobank_project_thumbnail_images 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.photobank_projects 
      WHERE id = photobank_project_thumbnail_images.project_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own project thumbnails" 
  ON public.photobank_project_thumbnail_images 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.photobank_projects 
      WHERE id = photobank_project_thumbnail_images.project_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own project thumbnails" 
  ON public.photobank_project_thumbnail_images 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.photobank_projects 
      WHERE id = photobank_project_thumbnail_images.project_id 
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for photobank_albums
CREATE POLICY "Users can view their own PhotoBank albums" 
  ON public.photobank_albums 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.photobank_projects 
      WHERE id = photobank_albums.project_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own PhotoBank albums" 
  ON public.photobank_albums 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.photobank_projects 
      WHERE id = photobank_albums.project_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own PhotoBank albums" 
  ON public.photobank_albums 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.photobank_projects 
      WHERE id = photobank_albums.project_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own PhotoBank albums" 
  ON public.photobank_albums 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.photobank_projects 
      WHERE id = photobank_albums.project_id 
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for photobank_album_thumbnail_images
CREATE POLICY "Users can view their own album thumbnails" 
  ON public.photobank_album_thumbnail_images 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.photobank_albums 
      JOIN public.photobank_projects ON photobank_albums.project_id = photobank_projects.id
      WHERE photobank_albums.id = photobank_album_thumbnail_images.album_id 
      AND photobank_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own album thumbnails" 
  ON public.photobank_album_thumbnail_images 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.photobank_albums 
      JOIN public.photobank_projects ON photobank_albums.project_id = photobank_projects.id
      WHERE photobank_albums.id = photobank_album_thumbnail_images.album_id 
      AND photobank_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own album thumbnails" 
  ON public.photobank_album_thumbnail_images 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.photobank_albums 
      JOIN public.photobank_projects ON photobank_albums.project_id = photobank_projects.id
      WHERE photobank_albums.id = photobank_album_thumbnail_images.album_id 
      AND photobank_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own album thumbnails" 
  ON public.photobank_album_thumbnail_images 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.photobank_albums 
      JOIN public.photobank_projects ON photobank_albums.project_id = photobank_projects.id
      WHERE photobank_albums.id = photobank_album_thumbnail_images.album_id 
      AND photobank_projects.user_id = auth.uid()
    )
  );

-- RLS Policies for photobank_album_images
CREATE POLICY "Users can view their own album images" 
  ON public.photobank_album_images 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.photobank_albums 
      JOIN public.photobank_projects ON photobank_albums.project_id = photobank_projects.id
      WHERE photobank_albums.id = photobank_album_images.album_id 
      AND photobank_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own album images" 
  ON public.photobank_album_images 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.photobank_albums 
      JOIN public.photobank_projects ON photobank_albums.project_id = photobank_projects.id
      WHERE photobank_albums.id = photobank_album_images.album_id 
      AND photobank_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own album images" 
  ON public.photobank_album_images 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.photobank_albums 
      JOIN public.photobank_projects ON photobank_albums.project_id = photobank_projects.id
      WHERE photobank_albums.id = photobank_album_images.album_id 
      AND photobank_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own album images" 
  ON public.photobank_album_images 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.photobank_albums 
      JOIN public.photobank_projects ON photobank_albums.project_id = photobank_projects.id
      WHERE photobank_albums.id = photobank_album_images.album_id 
      AND photobank_projects.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_photobank_projects_user_id ON public.photobank_projects(user_id);
CREATE INDEX idx_photobank_projects_thumbnail_image_id ON public.photobank_projects(thumbnail_image_id);
CREATE INDEX idx_photobank_project_thumbnail_images_project_id ON public.photobank_project_thumbnail_images(project_id);
CREATE INDEX idx_photobank_albums_project_id ON public.photobank_albums(project_id);
CREATE INDEX idx_photobank_albums_thumbnail_image_id ON public.photobank_albums(thumbnail_image_id);
CREATE INDEX idx_photobank_album_thumbnail_images_album_id ON public.photobank_album_thumbnail_images(album_id);
CREATE INDEX idx_photobank_album_images_album_id ON public.photobank_album_images(album_id);
CREATE INDEX idx_photobank_album_images_display_order ON public.photobank_album_images(album_id, display_order);

-- Create storage bucket for PhotoBank (if it doesn't exist)
-- Note: This requires Supabase Storage API, typically done via dashboard or CLI
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photobank', 'photobank', true)
-- ON CONFLICT (id) DO NOTHING;

