with checks as (
  select 'trigger: on_message_created' as test,
    case when exists (select 1 from pg_trigger where tgname='on_message_created') then 'PASS' else 'FAIL - missing' end as result
  union all select 'trigger: on_estimate_notify',
    case when exists (select 1 from pg_trigger where tgname='on_estimate_notify') then 'PASS' else 'FAIL - missing' end
  union all select 'trigger: on_booking_requested_tech',
    case when exists (select 1 from pg_trigger where tgname='on_booking_requested_tech') then 'PASS' else 'FAIL - missing' end
  union all select 'trigger: on_review_notify',
    case when exists (select 1 from pg_trigger where tgname='on_review_notify') then 'PASS' else 'FAIL - missing' end
  union all select 'trigger: on_booking_selected',
    case when exists (select 1 from pg_trigger where tgname='on_booking_selected') then 'PASS' else 'FAIL - missing' end
  union all select 'trigger: on_booking_status_change',
    case when exists (select 1 from pg_trigger where tgname='on_booking_status_change') then 'PASS' else 'FAIL - missing' end
  union all select 'realtime pub: messages',
    case when exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then 'PASS' else 'FAIL' end
  union all select 'realtime pub: notifications',
    case when exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then 'PASS' else 'FAIL' end
  union all select 'realtime pub: bookings',
    case when exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='bookings') then 'PASS' else 'FAIL' end
  union all select 'RLS: notifications insert',
    case when exists (select 1 from pg_policies where schemaname='public' and tablename='notifications' and cmd='INSERT') then 'PASS' else 'FAIL' end
  union all select 'RLS: messages update',
    case when exists (select 1 from pg_policies where schemaname='public' and tablename='messages' and cmd='UPDATE') then 'PASS' else 'FAIL' end
  union all select 'replica identity FULL on messages',
    case when (select c.relreplident from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='messages' limit 1)='f' then 'PASS' else 'FAIL' end
  union all select 'data: no kind=null notifications',
    case when (select count(*) from public.notifications where kind is null)=0 then 'PASS' else 'FAIL' end
  union all select 'data: no orphan notifications',
    case when (select count(*) from public.notifications n left join public.profiles p on p.id=n.recipient_id where p.id is null)=0 then 'PASS' else 'FAIL' end
)
select test, result from checks order by result desc, test;
