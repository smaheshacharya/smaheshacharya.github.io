-- ═══════════════════════════════════════════════════════════════
--  Mahesh Acharya personal site — Supabase schema + seed
--  Run once in Supabase SQL Editor (or rerun, it's idempotent).
--  Admin UID baked in: 91d6a183-4811-4789-8f72-20eb3dd678d8
-- ═══════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Tables ────────────────────────────────────────────────────

create table if not exists site_meta (
  id           int primary key default 1,
  hero_badge   text,
  hero_title   text,
  hero_sub     text,
  about_md     text,
  avatar_letter text default 'M',
  meta_based_in text,
  meta_role    text,
  meta_focus   text,
  meta_edu     text,
  updated_at   timestamptz default now(),
  constraint single_row check (id = 1)
);

create table if not exists stats (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  value      text not null,
  sort_order int  not null default 0
);

create table if not exists skill_groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  items      text[] not null default '{}',
  color      text default 'gray',   -- gray | blue | green | purple
  sort_order int not null default 0
);

create table if not exists experiences (
  id         uuid primary key default gen_random_uuid(),
  role       text not null,
  company    text not null,
  badge      text,
  start_date text,
  end_date   text,
  bullets    text[] not null default '{}',
  tech       text[] not null default '{}',
  sort_order int not null default 0
);

create table if not exists education (
  id         uuid primary key default gen_random_uuid(),
  degree     text not null,
  school     text,
  thesis     text,
  start_year int,
  end_year   int,
  sort_order int not null default 0
);

create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  year        text,
  description text,
  tags        text[] not null default '{}',
  icon        text,
  sort_order  int not null default 0
);

create table if not exists volunteering (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  org         text,
  date        text,
  description text,
  sort_order  int not null default 0
);

create table if not exists posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  excerpt      text,
  content_md   text not null default '',
  cover_url    text,
  claps        int  not null default 0,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists posts_published_idx on posts(is_published, published_at desc);

-- ── Schema additions: SEO fields (safe to re-run) ─────────────

alter table posts     add column if not exists seo_title       text;
alter table posts     add column if not exists seo_description text;
alter table site_meta add column if not exists seo_title       text;
alter table site_meta add column if not exists seo_description text;
alter table site_meta add column if not exists og_image        text;

-- Backfill a sensible default SEO description from the hero sub
update site_meta
   set seo_description = coalesce(seo_description, hero_sub)
 where id = 1;

-- ── updated_at trigger for posts ──────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists posts_set_updated_at on posts;
create trigger posts_set_updated_at before update on posts
for each row execute function set_updated_at();

-- ── Anonymous "clap" RPC ──────────────────────────────────────
-- security definer + body that can only += 1 protects us from
-- arbitrary writes. Client-side localStorage caps repeat clicks.

create or replace function clap_post(post_slug text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  update posts
     set claps = claps + 1
   where slug = post_slug and is_published = true
   returning claps into new_count;
  return coalesce(new_count, -1);
end;
$$;

grant execute on function clap_post(text) to anon, authenticated;

-- ── Row-Level Security ────────────────────────────────────────

alter table site_meta    enable row level security;
alter table stats        enable row level security;
alter table skill_groups enable row level security;
alter table experiences  enable row level security;
alter table education    enable row level security;
alter table projects     enable row level security;
alter table volunteering enable row level security;
alter table posts        enable row level security;

-- Public read (posts: only published)
do $$
declare t text;
begin
  foreach t in array array['site_meta','stats','skill_groups','experiences','education','projects','volunteering']
  loop
    execute format('drop policy if exists "public_read_%1$s" on %1$s', t);
    execute format('create policy "public_read_%1$s" on %1$s for select using (true)', t);
  end loop;

  drop policy if exists "public_read_posts" on posts;
  create policy "public_read_posts" on posts for select using (is_published = true);
end $$;

-- Admin write (all rights) — UID is hard-coded
do $$
declare
  admin_uid uuid := '91d6a183-4811-4789-8f72-20eb3dd678d8';
  t text;
begin
  foreach t in array array['site_meta','stats','skill_groups','experiences','education','projects','volunteering','posts']
  loop
    execute format('drop policy if exists "admin_write_%1$s" on %1$s', t);
    execute format(
      'create policy "admin_write_%1$s" on %1$s for all to authenticated using (auth.uid() = %2$L) with check (auth.uid() = %2$L)',
      t, admin_uid
    );
  end loop;

  -- Admin can also read drafts
  drop policy if exists "admin_read_drafts" on posts;
  execute format(
    'create policy "admin_read_drafts" on posts for select to authenticated using (auth.uid() = %L)',
    admin_uid
  );
end $$;

-- ═══════════════════════════════════════════════════════════════
--  SEED — port of the original index.html content
--  Idempotent: uses on conflict / not-exists guards.
-- ═══════════════════════════════════════════════════════════════

insert into site_meta (id, hero_badge, hero_title, hero_sub, about_md,
  meta_based_in, meta_role, meta_focus, meta_edu)
values (
  1,
  'Available for opportunities',
  'Helping Businesses Scale Using Data Analytics, Machine Learning & AI',
  'Co-founder @ AlphaTEDS · Faculty @ ASMT · Building intelligent systems that solve real problems.',
$$I'm a Data Scientist and Machine Learning Engineer based in Nepal, passionate about turning raw data into meaningful insights and building AI-powered products. As co-founder of **AlphaTEDS Technology**, I lead data science initiatives spanning forecasting, recommendation systems, and churn prediction.

Alongside my work in industry, I serve as a part-time faculty member at **Asian School of Management & Technology**, teaching database systems, web technology, and Python programming to the next generation of engineers.

My work spans the full ML lifecycle — from data wrangling and model development to deployment with MLOps practices — and I'm always looking for opportunities where technology can create measurable social and business impact.$$,
  'Nepal 🇳🇵',
  'Co-founder & Data Scientist',
  'ML · NLP · MLOps',
  'B.Sc. CSIT, TU'
)
on conflict (id) do nothing;

-- Stats
insert into stats (label, value, sort_order)
select * from (values
  ('Years experience', '5+', 1),
  ('ML projects',      '10+', 2),
  ('Mentees',          '2000+', 3)
) v(label, value, sort_order)
where not exists (select 1 from stats);

-- Skills
insert into skill_groups (name, items, color, sort_order)
select * from (values
  ('Languages',           array['Python','JavaScript','PostgreSQL','HTML / CSS'],                                'gray',   1),
  ('ML / AI',             array['Scikit-learn','PyTorch','NLP','Time Series','Recommendation Systems','NER'],     'blue',   2),
  ('Frameworks & Tools',  array['Django','REST API','Docker','MLOps','Trello'],                                   'green',  3),
  ('Databases & Cloud',   array['PostgreSQL','MongoDB','Pinecone','PowerBI'],                                     'purple', 4)
) v(name, items, color, sort_order)
where not exists (select 1 from skill_groups);

-- Experiences
insert into experiences (role, company, badge, start_date, end_date, bullets, tech, sort_order)
select * from (values
  (
    'Co-founder & Data Scientist',
    'AlphaTEDS Technology Pvt. Ltd.',
    null,
    'Feb 2023',
    'Present',
    array[
      'Developed an **ARIMAX time series model** to forecast business expenses for a logistics company — resulting in 15% monthly savings (~NPR 500,000) through improved budget planning and routing.',
      'Built a **semantic recommendation system** delivering 95% accurate real-time search results, significantly improving user engagement with public places in New York.',
      'Designed an **LSTM-based customer churn pipeline** for YourKoseli, enabling targeted marketing that boosted customer retention by 60%.'
    ],
    array['Python','Django','PyTorch','REST API','PostgreSQL','MongoDB','Pinecone','Docker','MLOps'],
    1
  ),
  (
    'Faculty Member',
    'Asian School of Management & Technology',
    'Part Time',
    'Nov 2022',
    'Present',
    array[
      'Teach undergraduate courses in Database Management Systems, Web Technology, Management Information Systems, Distributed DBMS, and Python Programming.',
      'Design and deliver lectures, lab sessions, and assignments enhancing students'' technical problem-solving skills.',
      'Guide students in project work and hands-on programming exercises for real-world application readiness.'
    ],
    array['Python','SQL','Web Technology','DBMS'],
    2
  ),
  (
    'Data Analyst',
    'Koseli Celebrations Pvt. Ltd.',
    null,
    'Jan 2020',
    'Jan 2023',
    array[
      'Developed a real-time **SQL-based logistics application** using PHP, reducing order cancellations by 40% and minimising reporting time.',
      'Created data visualisations and dashboards to monitor key customer KPIs, driving improved marketing campaigns and sales performance.'
    ],
    array['PHP (Laravel)','SQL','HTML/CSS','JavaScript','PowerBI'],
    3
  ),
  (
    'Machine Learning Engineer Intern',
    'Treeleaf Technologies Pvt. Ltd.',
    null,
    'Sep 2019',
    'Jan 2020',
    array[
      'Collected and curated multi-domain Nepali text data for NER research and model training.',
      'Trained and evaluated custom Nepali NER models using Stanford NER with a focus on annotation and feature tuning.',
      'Refined datasets based on performance analysis to improve detection of person, location, and organisation entities.'
    ],
    array['Python','Scikit-learn','NLP / NER','Linguistic Annotation'],
    4
  )
) v(role, company, badge, start_date, end_date, bullets, tech, sort_order)
where not exists (select 1 from experiences);

-- Education
insert into education (degree, school, thesis, start_year, end_year, sort_order)
select * from (values
  (
    'Bachelor of Science in Computer Science & Information Technology',
    'Asian School of Management and Technology, Tribhuvan University',
    'Sentiment Analysis of Nepali Comments Using Naive Bayes — Achieved 75% accuracy; created a standardised Nepali sentiment dataset.',
    2015,
    2019,
    1
  )
) v(degree, school, thesis, start_year, end_year, sort_order)
where not exists (select 1 from education);

-- Projects / awards
insert into projects (title, year, description, tags, icon, sort_order)
select * from (values
  ('Sentiment Analysis of Nepali Comments', '2019',     'Academic project achieving 75% accuracy with Naive Bayes. Created a standardised Nepali sentiment dataset improving access to digital language resources for the research community.', array['Python','NLP','Naive Bayes'],  '📊', 1),
  ('Runner-Up — Inter-college Hackathon',   '2018',     'Developed a mobile app + IoT-based wrist device (smartwatch-like) designed to send instant alerts to the nearest authorities when the user feels unsafe.',                          array['IoT','Mobile App','Safety Tech'], '🏆', 2),
  ('Merit-Based Scholarship',                '2015–2019','Awarded full tuition waivers for the 3rd and 6th semesters of undergraduate study based on academic merit.',                                                                   array['Academic Excellence'],          '🎖️', 3)
) v(title, year, description, tags, icon, sort_order)
where not exists (select 1 from projects);

-- Volunteering
insert into volunteering (title, org, date, description, sort_order)
select * from (values
  ('Mentor — Hacking for Empowered Women', 'Shequal Foundation · National-level hackathon in collaboration with UN Women', 'Jul 2025', 'Mentored 60 participants in ideation, system design, and development of innovative tech-based solutions addressing challenges faced by marginalised women, with a focus on sustainable impact and gender equity.', 1),
  ('Mentor — Inter-college Hackathon',     'Asian School of Management and Technology',                                    'Sep 2024', 'Guided and supported 20 teams throughout an intensive hackathon. Provided mentorship on problem-solving, project development, and effective time management to students from across Nepal.',                              2),
  ('Train Nepal to ICT Development Campaign', 'Dhading District, Nepal · Ministry of Information Technology',              'May 2018', 'Part of a seven-member team that conducted a campaign in a rural village of Dhading district to promote IT literacy, cybersecurity awareness, and social media safety among teenagers. Organised a boot camp covering basics of networking.', 3)
) v(title, org, date, description, sort_order)
where not exists (select 1 from volunteering);

-- Posts — port the 3 LinkedIn placeholders so the home page is populated
insert into posts (slug, title, excerpt, content_md, is_published, published_at)
select * from (values
  (
    'lstm-churn-yourkoseli',
    'How an LSTM churn model boosted YourKoseli retention by 60%',
    'Combining transaction history with engagement signals flagged at-risk users 2 weeks before churn.',
$$Excited to share that our **LSTM-based churn prediction pipeline** at YourKoseli achieved a **60% boost in customer retention** through targeted marketing.

The key was combining transaction history with engagement signals — the model flagged at-risk users **2 weeks before churn**, giving the growth team a real window to act.

## What worked

- **Sequence features** (last 30 days of activity) — far more predictive than aggregate counts.
- **Two-stage scoring**: a cheap rule filter, then the LSTM on the remaining ~15% of users.
- **Re-training cadence** every 2 weeks. Drift was real.

## What I'd do differently

- Start with a simpler baseline (logistic on engineered features) before reaching for sequence models.
- Build the feedback loop into the marketing tool from day one.$$,
    true,
    now() - interval '14 days'
  ),
  (
    'mentoring-hacking-for-empowered-women',
    'Mentoring 60 builders at Hacking for Empowered Women',
    'Notes from a humbling weekend with Shequal Foundation × UN Women.',
$$Just wrapped up mentoring **60 participants** at the *Hacking for Empowered Women* hackathon by Shequal Foundation in collaboration with UN Women.

Witnessing teams build tech solutions to address real challenges faced by marginalised women was truly humbling. This is why we build. 🙌

A few patterns I saw across the strongest teams:

1. They talked to a real user in the first 6 hours.
2. They scoped down ruthlessly — one feature, done well.
3. They practiced the demo at least twice before pitching.$$,
    true,
    now() - interval '7 days'
  ),
  (
    'arimax-vs-lstm',
    'ARIMAX vs LSTM for time series — which should you pick?',
    'After building both in production, my take on when each one wins.',
$$**ARIMAX vs LSTM** for time series forecasting — which should you pick?

After building both in production, my take:

- **ARIMAX** wins when interpretability and explainability matter to stakeholders. Coefficients map directly to drivers; finance teams trust it.
- **LSTM** wins when the signal is complex and non-linear, and you have enough data to avoid overfitting (think: tens of thousands of observations, not hundreds).

Context is everything. The boring model that ships and gets adopted beats the clever model that nobody trusts.$$,
    true,
    now() - interval '2 days'
  )
) v(slug, title, excerpt, content_md, is_published, published_at)
where not exists (select 1 from posts);
