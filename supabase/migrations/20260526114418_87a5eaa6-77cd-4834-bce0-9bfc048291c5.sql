-- CMS pages
drop policy if exists "admins pages all select" on public.cms_pages;
drop policy if exists "admins pages insert" on public.cms_pages;
drop policy if exists "admins pages update" on public.cms_pages;
drop policy if exists "admins pages delete" on public.cms_pages;
create policy "editors pages all select" on public.cms_pages for select using (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','editor']::app_role[]));
create policy "editors pages insert" on public.cms_pages for insert with check (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','editor']::app_role[]));
create policy "editors pages update" on public.cms_pages for update using (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','editor']::app_role[]));
create policy "editors pages delete" on public.cms_pages for delete using (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','editor']::app_role[]));

-- CMS posts
drop policy if exists "admins posts all select" on public.cms_posts;
drop policy if exists "admins posts insert" on public.cms_posts;
drop policy if exists "admins posts update" on public.cms_posts;
drop policy if exists "admins posts delete" on public.cms_posts;
create policy "editors posts all select" on public.cms_posts for select using (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','editor']::app_role[]));
create policy "editors posts insert" on public.cms_posts for insert with check (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','editor']::app_role[]));
create policy "editors posts update" on public.cms_posts for update using (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','editor']::app_role[]));
create policy "editors posts delete" on public.cms_posts for delete using (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','editor']::app_role[]));

-- Returns (support + manager + admin/super_admin)
drop policy if exists "admins returns select" on public.returns;
drop policy if exists "admins returns update" on public.returns;
drop policy if exists "admins returns delete" on public.returns;
create policy "ops returns select" on public.returns for select using (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','support']::app_role[]));
create policy "ops returns update" on public.returns for update using (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','support']::app_role[]));
create policy "ops returns delete" on public.returns for delete using (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager']::app_role[]));

-- Return items
drop policy if exists "admins return items select" on public.return_items;
drop policy if exists "admins return items update" on public.return_items;
drop policy if exists "admins return items delete" on public.return_items;
create policy "ops return items select" on public.return_items for select using (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','support']::app_role[]));
create policy "ops return items update" on public.return_items for update using (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','support']::app_role[]));
create policy "ops return items delete" on public.return_items for delete using (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager']::app_role[]));

-- Shipments
drop policy if exists "admins shipments select" on public.shipments;
drop policy if exists "admins shipments insert" on public.shipments;
drop policy if exists "admins shipments update" on public.shipments;
drop policy if exists "admins shipments delete" on public.shipments;
create policy "ops shipments select" on public.shipments for select using (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','fulfillment','warehouse_staff']::app_role[]));
create policy "ops shipments insert" on public.shipments for insert with check (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','fulfillment','warehouse_staff']::app_role[]));
create policy "ops shipments update" on public.shipments for update using (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','fulfillment','warehouse_staff']::app_role[]));
create policy "ops shipments delete" on public.shipments for delete using (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager']::app_role[]));

-- Shipment events
drop policy if exists "admins shipment events select" on public.shipment_events;
drop policy if exists "admins shipment events insert" on public.shipment_events;
create policy "ops shipment events select" on public.shipment_events for select using (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','fulfillment','warehouse_staff']::app_role[]));
create policy "ops shipment events insert" on public.shipment_events for insert with check (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','fulfillment','warehouse_staff']::app_role[]));

-- Also: inventory_logs (used by admin-inventory; warehouse_staff and manager should be able to log)
drop policy if exists "admins insert inventory logs" on public.inventory_logs;
drop policy if exists "admins view inventory logs" on public.inventory_logs;
create policy "ops insert inventory logs" on public.inventory_logs for insert with check (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','warehouse_staff']::app_role[]));
create policy "ops view inventory logs" on public.inventory_logs for select using (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','warehouse_staff']::app_role[]));