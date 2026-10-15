-- ============================================================
-- Fix: break RLS recursion in my_role() and is_admin()
--
-- Both functions read `profiles`, which has an RLS policy that
-- calls these same functions. Without security definer, Postgres
-- recurses infinitely (stack depth exceeded, or 57014 timeouts
-- under load).
-- ============================================================

create or replace function public.my_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;
