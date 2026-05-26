
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  category text not null,
  price numeric not null default 0,
  rating numeric not null default 0,
  reviews integer not null default 0,
  image text,
  description text,
  in_stock boolean not null default true,
  discount integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "products are viewable by everyone" on public.products for select using (true);
create policy "admins insert products" on public.products for insert with check (public.has_role(auth.uid(), 'admin'));
create policy "admins update products" on public.products for update using (public.has_role(auth.uid(), 'admin'));
create policy "admins delete products" on public.products for delete using (public.has_role(auth.uid(), 'admin'));

create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

insert into public.products (slug, name, tagline, category, price, rating, reviews, image, description, in_stock, discount, sort_order) values
('aero-x-buds','Aero-X Buds','Titanium Series','electronics',189,4.9,1284,'/src/assets/product-earbuds.jpg','Studio-grade wireless earbuds with active noise cancellation and 36-hour playback.',true,15,1),
('tempus-one','Tempus One','Swiss Movement','accessories',340,4.8,612,'/src/assets/product-watch.jpg','A precision automatic timepiece machined from a single block of brushed titanium.',true,null,2),
('beam-desk-light','Beam Desk Light','Smart Dimmable','home',120,4.7,942,'/src/assets/product-lamp.jpg','Sculpted aluminum desk lamp with circadian temperature control.',true,null,3),
('obsidian-headphones','Obsidian Headphones','Reference Audio','electronics',399,4.9,2103,'/src/assets/product-headphones.jpg','Reference-class over-ear headphones with planar magnetic drivers.',true,10,4),
('titan-flask','Titan Flask','Aerospace Grade','fitness',85,4.6,478,'/src/assets/product-flask.jpg','Vacuum-insulated titanium flask. 24h cold, 12h hot.',true,null,5),
('halo-keyboard','Halo Keyboard','Tactile Switch','gaming',240,4.8,856,'/src/assets/product-keyboard.jpg','Low-profile mechanical keyboard with hot-swap switches.',true,null,6),
('voyage-pack','Voyage Pack','Full-Grain Leather','fashion',295,4.7,321,'/src/assets/product-backpack.jpg','Full-grain leather backpack with magnetic closures.',true,null,7),
('ember-shades','Ember Shades','Polarized','fashion',160,4.5,234,'/src/assets/product-sunglasses.jpg','Hand-finished acetate frames with polarized amber lenses.',true,20,8);
