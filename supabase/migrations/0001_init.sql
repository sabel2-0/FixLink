-- ============================================================
-- FixLink initial schema
-- Run this in Supabase SQL Editor (or via `supabase db push`)
-- ============================================================

create type user_role as enum ('customer', 'technician', 'admin');
create type cert_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type booking_status as enum (
  'pending','estimated','confirmed','en_route','arrived',
  'in_progress','quote_pending','completed','cancelled','disputed'
);

-- ============ PROFILES ============
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role user_role not null default 'customer',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- ============ TECHNICIAN PROFILE ============
create table technician_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  bio text,
  specialty text,
  home_barangay text,
  home_lat double precision,
  home_lng double precision,
  service_radius_km int default 6,
  rating numeric(2,1) default 5.0,
  jobs_completed int default 0,
  cert_number text,
  cert_trade text,
  cert_file_path text,
  cert_status cert_status not null default 'unverified',
  cert_submitted_at timestamptz,
  cert_reviewed_at timestamptz,
  cert_reviewed_by uuid references profiles(id),
  cert_rejection_reason text
);

create table technician_services (
  technician_id uuid references technician_profiles(id) on delete cascade,
  service text not null,
  primary key (technician_id, service)
);

-- ============ ADDRESSES ============
create table customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id) on delete cascade,
  label text,
  barangay text,
  landmark text,
  lat double precision,
  lng double precision,
  is_default boolean default false
);

-- ============ BOOKINGS ============
create table bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id) not null,
  technician_id uuid references technician_profiles(id),
  status booking_status not null default 'pending',
  barangay text,
  address text,
  lat double precision,
  lng double precision,
  scheduled_date date,
  scheduled_time time,
  final_amount numeric(10,2),
  final_commission numeric(10,2),
  created_at timestamptz default now()
);

create table booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  service text not null,
  problems text[] not null,
  notes text
);

create table booking_requested_techs (
  booking_id uuid references bookings(id) on delete cascade,
  technician_id uuid references technician_profiles(id) on delete cascade,
  primary key (booking_id, technician_id)
);

-- ============ ESTIMATES ============
create table estimates (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  technician_id uuid references technician_profiles(id),
  amount numeric(10,2) not null,
  note text,
  created_at timestamptz default now(),
  unique (booking_id, technician_id)
);

-- ============ QUOTATIONS ============
create table quotes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  total numeric(10,2) not null,
  commission numeric(10,2) not null,
  status text default 'pending',
  sent_at timestamptz default now(),
  decided_at timestamptz
);

create table quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotes(id) on delete cascade,
  label text not null,
  amount numeric(10,2) not null
);

-- ============ COMMISSIONS ============
create table commissions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  technician_id uuid references technician_profiles(id),
  final_amount numeric(10,2),
  rate numeric(4,3) default 0.10,
  commission numeric(10,2),
  status text default 'owed',
  created_at timestamptz default now(),
  paid_at timestamptz
);

-- ============ REVIEWS ============
create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) unique,
  customer_id uuid references profiles(id),
  technician_id uuid references technician_profiles(id),
  workmanship int check (workmanship between 1 and 5),
  punctuality int check (punctuality between 1 and 5),
  cleanliness int check (cleanliness between 1 and 5),
  price_fairness int check (price_fairness between 1 and 5),
  avg_rating numeric(2,1),
  text text,
  photo_path text,
  created_at timestamptz default now()
);

-- ============ MESSAGES ============
create table messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  sender_id uuid references profiles(id),
  body text not null,
  created_at timestamptz default now()
);

-- ============ NOTIFICATIONS ============
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references profiles(id),
  title text,
  body text,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

-- ============ LIVE LOCATIONS ============
create table live_locations (
  user_id uuid primary key references profiles(id) on delete cascade,
  lat double precision,
  lng double precision,
  sharing boolean default false,
  updated_at timestamptz default now()
);

-- ============ DISPUTES ============
create table disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  customer_id uuid references profiles(id),
  technician_id uuid references technician_profiles(id),
  reason text,
  details text,
  status text default 'open',
  resolution text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- ============ AUDIT LOG ============
create table audit_log (
  id bigint generated always as identity primary key,
  actor text,
  action text,
  target text,
  meta jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- Trigger: auto-create profile (+ technician_profiles row) on signup
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')
  );

  if coalesce(new.raw_user_meta_data->>'role', 'customer') = 'technician' then
    insert into public.technician_profiles (id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table technician_profiles enable row level security;
alter table technician_services enable row level security;
alter table customer_addresses enable row level security;
alter table bookings enable row level security;
alter table booking_items enable row level security;
alter table booking_requested_techs enable row level security;
alter table estimates enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;
alter table commissions enable row level security;
alter table reviews enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table live_locations enable row level security;
alter table disputes enable row level security;
alter table audit_log enable row level security;

create or replace function my_role() returns user_role
language sql stable as $$
  select role from profiles where id = auth.uid()
$$;

-- profiles
create policy "users read own profile" on profiles for select using (id = auth.uid());
create policy "admins read all profiles" on profiles for select using (my_role() = 'admin');
create policy "users update own profile" on profiles for update using (id = auth.uid());

-- technician_profiles
create policy "public reads verified tech profiles" on technician_profiles for select using (
  cert_status = 'verified' or id = auth.uid() or my_role() = 'admin'
);
create policy "tech updates own profile" on technician_profiles for update using (id = auth.uid());
create policy "admin updates any tech profile" on technician_profiles for update using (my_role() = 'admin');

-- bookings
create policy "customers see own bookings" on bookings for select using (customer_id = auth.uid());
create policy "technicians see assigned/invited bookings" on bookings for select using (
  technician_id = auth.uid()
  or exists (
    select 1 from booking_requested_techs brt
    where brt.booking_id = bookings.id and brt.technician_id = auth.uid()
  )
);
create policy "admins see all bookings" on bookings for select using (my_role() = 'admin');
create policy "customers create own bookings" on bookings for insert with check (customer_id = auth.uid());
create policy "customers update own bookings" on bookings for update using (customer_id = auth.uid());
create policy "technicians update assigned bookings" on bookings for update using (technician_id = auth.uid());

-- estimates
create policy "techs manage own estimates" on estimates for all using (technician_id = auth.uid());
create policy "customers read estimates on their bookings" on estimates for select using (
  exists (select 1 from bookings b where b.id = estimates.booking_id and b.customer_id = auth.uid())
);

-- quotes
create policy "customers read own quotes" on quotes for select using (
  exists (select 1 from bookings b where b.id = quotes.booking_id and b.customer_id = auth.uid())
);
create policy "techs manage quotes on their bookings" on quotes for all using (
  exists (select 1 from bookings b where b.id = quotes.booking_id and b.technician_id = auth.uid())
);

-- reviews
create policy "customers create reviews on own bookings" on reviews for insert with check (customer_id = auth.uid());
create policy "public reads reviews" on reviews for select using (true);

-- messages
create policy "participants read booking messages" on messages for select using (
  exists (
    select 1 from bookings b where b.id = messages.booking_id
    and (b.customer_id = auth.uid() or b.technician_id = auth.uid())
  )
);
create policy "participants send booking messages" on messages for insert with check (
  sender_id = auth.uid() and exists (
    select 1 from bookings b where b.id = messages.booking_id
    and (b.customer_id = auth.uid() or b.technician_id = auth.uid())
  )
);

-- notifications
create policy "users read own notifications" on notifications for select using (recipient_id = auth.uid());
create policy "users update own notifications" on notifications for update using (recipient_id = auth.uid());

-- live_locations
create policy "users manage own location" on live_locations for all using (user_id = auth.uid());
create policy "booking participants read counterpart location" on live_locations for select using (
  exists (
    select 1 from bookings b
    where (b.customer_id = auth.uid() and b.technician_id = live_locations.user_id)
       or (b.technician_id = auth.uid() and b.customer_id = live_locations.user_id)
  )
);

-- disputes
create policy "customers create disputes on own bookings" on disputes for insert with check (customer_id = auth.uid());
create policy "participants read own disputes" on disputes for select using (
  customer_id = auth.uid() or technician_id = auth.uid() or my_role() = 'admin'
);
create policy "admin updates disputes" on disputes for update using (my_role() = 'admin');

-- audit_log
create policy "admin reads audit log" on audit_log for select using (my_role() = 'admin');

-- ============================================================
-- Storage: run AFTER manually creating a private bucket named 'certs'
-- (Dashboard > Storage > New bucket > name "certs", Public = OFF)
-- ============================================================
create policy "tech uploads own cert"
  on storage.objects for insert
  with check (
    bucket_id = 'certs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "tech reads own cert"
  on storage.objects for select
  using (
    bucket_id = 'certs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "admin reads all certs"
  on storage.objects for select
  using (
    bucket_id = 'certs'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
