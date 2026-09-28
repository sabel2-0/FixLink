create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer');
  v_phone text := new.raw_user_meta_data->>'phone';
  v_cert_number text := new.raw_user_meta_data->>'cert_number';
  v_cert_trade text := new.raw_user_meta_data->>'cert_trade';
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.email,
    v_phone,
    v_role
  );

  if v_role = 'technician' then
    insert into public.technician_profiles (id, cert_number, cert_trade, cert_status)
    values (
      new.id,
      v_cert_number,
      v_cert_trade,
      case
        when v_cert_number is not null or v_cert_trade is not null
        then 'pending'::cert_status
        else 'unverified'::cert_status
      end
    );
  end if;

  return new;
end;
$$;
