-- ============================================================================
-- FlowDesk · seed.sql — demo data for the DEV project
-- ============================================================================
-- Safe to re-run: fixed UUIDs + ON CONFLICT DO NOTHING.
-- Deliberately contains NO auth users: create the first admin in the Supabase
-- dashboard (see CLAUDE.md), invite employees from the app, then assign leads
-- and tasks from the UI. Project progress is recalculated by triggers.

-- ---------------------------------------------------------------------------
-- Services + template tasks
-- ---------------------------------------------------------------------------
insert into public.services (id, title, description) values
  ('10000000-0000-4000-8000-000000000001', 'Semantic SEO Campaign',
   'Topical-authority SEO engagement: audit, topical map, content briefs, on-page and technical fixes.'),
  ('10000000-0000-4000-8000-000000000002', 'Website Development',
   'Design and build of a marketing website on Next.js with CMS hand-off.'),
  ('10000000-0000-4000-8000-000000000003', 'Brand & UI Design',
   'Logo, brand system and UI kit for product and marketing surfaces.'),
  ('10000000-0000-4000-8000-000000000004', 'Ecommerce SEO',
   'Category/product page optimisation, internal linking and schema for online stores.')
on conflict (id) do nothing;

insert into public.service_template_tasks (id, service_id, title, description, estimated_hours, position) values
  -- Semantic SEO Campaign
  ('11000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Technical & content audit', 'Crawl the site, log indexation, CWV and content gaps.', 8, 1),
  ('11000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Build topical map', 'Central entity, source context, core + outer sections.', 12, 2),
  ('11000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Write content briefs (batch 1)', 'Outlines + briefs for the first 10 URLs.', 16, 3),
  ('11000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'On-page implementation', 'Headings, internal links, schema on priority pages.', 10, 4),
  ('11000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'Monthly performance report', 'GSC + ranking movement summary.', 3, 5),
  -- Website Development
  ('11000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000002', 'Discovery & sitemap', 'Confirm pages, goals and integrations.', 4, 1),
  ('11000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000002', 'Wireframes', 'Low-fi layouts for all templates.', 8, 2),
  ('11000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000002', 'Visual design', 'High-fidelity screens, light + dark.', 16, 3),
  ('11000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000002', 'Front-end build', 'Next.js + Tailwind implementation.', 32, 4),
  ('11000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000002', 'CMS integration', 'Connect content models and preview.', 10, 5),
  ('11000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000002', 'QA & launch', 'Cross-browser QA, DNS, go-live checklist.', 6, 6),
  -- Brand & UI Design
  ('11000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000003', 'Brand discovery workshop', 'Positioning, audience, tone.', 4, 1),
  ('11000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000003', 'Logo concepts', 'Three directions, one round of revisions.', 12, 2),
  ('11000000-0000-4000-8000-000000000023', '10000000-0000-4000-8000-000000000003', 'Brand guidelines', 'Colour, type, spacing, usage rules.', 8, 3),
  ('11000000-0000-4000-8000-000000000024', '10000000-0000-4000-8000-000000000003', 'UI kit', 'Component library in Figma.', 14, 4),
  -- Ecommerce SEO
  ('11000000-0000-4000-8000-000000000031', '10000000-0000-4000-8000-000000000004', 'Category page audit', 'Crawl, cannibalisation and faceted-nav review.', 6, 1),
  ('11000000-0000-4000-8000-000000000032', '10000000-0000-4000-8000-000000000004', 'Product schema rollout', 'Product, Offer, Review schema across PDPs.', 8, 2),
  ('11000000-0000-4000-8000-000000000033', '10000000-0000-4000-8000-000000000004', 'Internal linking plan', 'Hub-and-spoke links from guides to categories.', 6, 3),
  ('11000000-0000-4000-8000-000000000034', '10000000-0000-4000-8000-000000000004', 'Collection copy (batch 1)', 'SEO copy for the top 10 collections.', 12, 4)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------------
insert into public.clients (id, company_name, contact_name, email, phone, notes) values
  ('20000000-0000-4000-8000-000000000001', 'Northwind Outdoors', 'Sara Malik', 'sara@northwind-outdoors.example', '+44 20 7946 0101', 'UK retailer. Prefers Monday updates.'),
  ('20000000-0000-4000-8000-000000000002', 'Lumen Dental', 'Dr. Imran Qureshi', 'imran@lumendental.example', '+1 415 555 0142', 'Two clinics; wants local SEO later.'),
  ('20000000-0000-4000-8000-000000000003', 'Pixel Harbor Studio', 'Mei Chen', 'mei@pixelharbor.example', '+65 6555 0199', 'Design-led SaaS; strict brand guidelines.'),
  ('20000000-0000-4000-8000-000000000004', 'Greenline Logistics', 'Tom Becker', 'tom@greenline.example', '+49 30 555 0177', 'Slow approvals — allow buffer on due dates.'),
  ('20000000-0000-4000-8000-000000000005', 'Aurora Skincare', 'Hina Raza', 'hina@auroraskin.example', '+92 300 555 0123', 'Shopify store, 400 SKUs.')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Projects: a mix of pending (activate from the UI), active (tasks seeded
-- below) and one on hold. lead_id is left NULL — set it from the UI.
-- ---------------------------------------------------------------------------
insert into public.projects (id, client_id, service_id, name, status, start_date, due_date) values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'Northwind — Ecommerce SEO Q4',   'active',  current_date - 20, current_date + 25),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Lumen Dental — New website',      'active',  current_date - 35, current_date + 10),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'Pixel Harbor — Brand refresh',    'active',  current_date - 10, current_date + 40),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Greenline — Semantic SEO',        'pending', null,              current_date + 60),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000004', 'Aurora — Ecommerce SEO',          'pending', null,              current_date + 45),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'Northwind — Landing pages',       'on_hold', current_date - 50, current_date - 3)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Tasks for the active projects (copied from their service templates, the
-- same way activate_project() does it). Only inserted once per project.
-- ---------------------------------------------------------------------------
insert into public.tasks (project_id, title, description, estimated_hours, position, due_date)
select p.id, t.title, t.description, t.estimated_hours, t.position,
       p.start_date + (t.position * 7)
  from public.projects p
  join public.service_template_tasks t on t.service_id = p.service_id
 where p.id in ('30000000-0000-4000-8000-000000000001',
                '30000000-0000-4000-8000-000000000002',
                '30000000-0000-4000-8000-000000000003',
                '30000000-0000-4000-8000-000000000006')
   and not exists (select 1 from public.tasks x where x.project_id = p.id);

-- Give the demo some shape: early tasks done, middle ones moving, plus a few
-- priorities. Progress % and completed_at are set by triggers.
update public.tasks set status = 'completed'   where position = 1 and status = 'todo';
update public.tasks set status = 'in_progress' where position = 2 and status = 'todo';
update public.tasks set status = 'in_review'   where position = 3 and status = 'todo'
   and project_id = '30000000-0000-4000-8000-000000000002';
update public.tasks set priority = 'urgent'    where project_id = '30000000-0000-4000-8000-000000000002' and position = 4;
update public.tasks set priority = 'high'      where project_id = '30000000-0000-4000-8000-000000000001' and position in (2, 3);
update public.tasks set priority = 'low'       where position >= 5;

-- A couple of subtasks on the first in-progress task of each active project.
insert into public.task_subtasks (task_id, title, is_done, position)
select t.id, s.title, s.is_done, s.position
  from public.tasks t
  cross join (values ('Collect inputs from client', true, 1),
                     ('Draft', false, 2),
                     ('Internal review', false, 3)) as s(title, is_done, position)
 where t.status = 'in_progress'
   and not exists (select 1 from public.task_subtasks x where x.task_id = t.id);
