CREATE TABLE public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  meta_title text,
  meta_description text,
  published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published pages public" ON public.cms_pages FOR SELECT USING (published = true);
CREATE POLICY "admins pages all select" ON public.cms_pages FOR SELECT USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admins pages insert" ON public.cms_pages FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admins pages update" ON public.cms_pages FOR UPDATE USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admins pages delete" ON public.cms_pages FOR DELETE USING (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER cms_pages_updated_at BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.cms_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text,
  body text NOT NULL DEFAULT '',
  cover_image text,
  author text,
  meta_title text,
  meta_description text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published posts public" ON public.cms_posts FOR SELECT USING (published_at IS NOT NULL AND published_at <= now());
CREATE POLICY "admins posts all select" ON public.cms_posts FOR SELECT USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admins posts insert" ON public.cms_posts FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admins posts update" ON public.cms_posts FOR UPDATE USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admins posts delete" ON public.cms_posts FOR DELETE USING (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER cms_posts_updated_at BEFORE UPDATE ON public.cms_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_cms_posts_published ON public.cms_posts(published_at DESC);