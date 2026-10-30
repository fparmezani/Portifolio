-- Débito e reembolso com quantidade (o Raio-X custa 3, o simulado continua 1).
-- Remove a assinatura antiga para o PostgREST não ficar com duas funções ambíguas.
drop function if exists public.consumir_credito(text);
drop function if exists public.reembolsar_credito(text);

create or replace function public.consumir_credito(p_ferramenta text, p_quantidade integer default 1)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  saldo integer;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_quantidade is null or p_quantidade < 1 or p_quantidade > 10 then
    raise exception 'invalid_amount' using errcode = '22023';
  end if;

  perform set_config('credits.bypass', 'on', true);

  update public.profiles
  set credits = credits - p_quantidade
  where id = uid and credits >= p_quantidade
  returning credits into saldo;

  if not found then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  insert into public.credit_ledger (user_id, delta, reason, ferramenta)
  values (uid, -p_quantidade, 'uso', p_ferramenta);

  return saldo;
end;
$$;

revoke all on function public.consumir_credito(text, integer) from public;
revoke all on function public.consumir_credito(text, integer) from anon;
grant execute on function public.consumir_credito(text, integer) to authenticated;
grant execute on function public.consumir_credito(text, integer) to service_role;

-- Reembolso só pelo backend (service_role). Antes ficava aberto a authenticated,
-- e qualquer pessoa logada podia se dar créditos chamando a RPC pelo navegador.
create or replace function public.reembolsar_credito(p_user_id uuid, p_ferramenta text, p_quantidade integer default 1)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  saldo integer;
begin
  if p_user_id is null then
    raise exception 'missing_user' using errcode = '22023';
  end if;
  if p_quantidade is null or p_quantidade < 1 or p_quantidade > 10 then
    raise exception 'invalid_amount' using errcode = '22023';
  end if;

  perform set_config('credits.bypass', 'on', true);

  update public.profiles
  set credits = credits + p_quantidade
  where id = p_user_id
  returning credits into saldo;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  insert into public.credit_ledger (user_id, delta, reason, ferramenta)
  values (p_user_id, p_quantidade, 'reembolso', p_ferramenta);

  return saldo;
end;
$$;

revoke all on function public.reembolsar_credito(uuid, text, integer) from public;
revoke all on function public.reembolsar_credito(uuid, text, integer) from authenticated;
revoke all on function public.reembolsar_credito(uuid, text, integer) from anon;
grant execute on function public.reembolsar_credito(uuid, text, integer) to service_role;
