-- Créditos das ferramentas (Raio-X, Simulador) + ledger para auditoria e Stripe.
-- Rodar no SQL Editor do Supabase.

-- Saldo no perfil. Contas já existentes ficam em 0; novos inserts ganham 10 via trigger.
alter table public.profiles
  add column if not exists credits integer not null default 0;

comment on column public.profiles.credits is
  'Saldo de créditos das ferramentas. 10 no cadastro (único); compras via Stripe.';

create table if not exists public.credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  delta integer not null,
  reason text not null,
  ferramenta text,
  stripe_session_id text,
  created_at timestamptz not null default now(),
  constraint credit_ledger_stripe_session_unique unique (stripe_session_id)
);

create index if not exists credit_ledger_user_id_idx
  on public.credit_ledger (user_id);

comment on table public.credit_ledger is
  'Movimentações de créditos (+ cadastro/compra/reembolso, - uso).';

alter table public.credit_ledger enable row level security;

drop policy if exists credit_ledger_select_own on public.credit_ledger;
create policy credit_ledger_select_own
  on public.credit_ledger
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Impede o cliente de alterar o saldo direto; funções security definer usam credits.bypass=on.
create or replace function public.profiles_lock_credits()
returns trigger
language plpgsql
as $$
begin
  if new.credits is distinct from old.credits
     and coalesce(current_setting('credits.bypass', true), '') <> 'on' then
    new.credits := old.credits;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_credits_trg on public.profiles;
create trigger profiles_lock_credits_trg
  before update on public.profiles
  for each row
  execute function public.profiles_lock_credits();

-- 10 créditos no primeiro insert do perfil (não renova; não afeta linhas já existentes).
create or replace function public.profiles_signup_credits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.credits := 10;
  return new;
end;
$$;

drop trigger if exists profiles_signup_credits_trg on public.profiles;
create trigger profiles_signup_credits_trg
  before insert on public.profiles
  for each row
  execute function public.profiles_signup_credits();

create or replace function public.profiles_signup_credits_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.credit_ledger (user_id, delta, reason, ferramenta)
  values (new.id, 10, 'bonus_cadastro', null);
  return new;
end;
$$;

drop trigger if exists profiles_signup_credits_ledger_trg on public.profiles;
create trigger profiles_signup_credits_ledger_trg
  after insert on public.profiles
  for each row
  execute function public.profiles_signup_credits_ledger();

-- Debita 1 crédito do usuário autenticado. Retorna o saldo restante.
create or replace function public.consumir_credito(p_ferramenta text)
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

  perform set_config('credits.bypass', 'on', true);

  update public.profiles
  set credits = credits - 1
  where id = uid and credits >= 1
  returning credits into saldo;

  if not found then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  insert into public.credit_ledger (user_id, delta, reason, ferramenta)
  values (uid, -1, 'uso', p_ferramenta);

  return saldo;
end;
$$;

revoke all on function public.consumir_credito(text) from public;
grant execute on function public.consumir_credito(text) to authenticated;
grant execute on function public.consumir_credito(text) to service_role;

-- Reembolsa 1 crédito (ex.: falha da IA depois do débito).
create or replace function public.reembolsar_credito(p_ferramenta text)
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

  perform set_config('credits.bypass', 'on', true);

  update public.profiles
  set credits = credits + 1
  where id = uid
  returning credits into saldo;

  insert into public.credit_ledger (user_id, delta, reason, ferramenta)
  values (uid, 1, 'reembolso', p_ferramenta);

  return saldo;
end;
$$;

revoke all on function public.reembolsar_credito(text) from public;
grant execute on function public.reembolsar_credito(text) to authenticated;
grant execute on function public.reembolsar_credito(text) to service_role;

-- Compra Stripe: só service_role (backend com service key).
create or replace function public.adicionar_creditos_compra(
  p_user_id uuid,
  p_quantidade integer,
  p_stripe_session_id text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  saldo integer;
begin
  if p_user_id is null or p_quantidade is null or p_quantidade <= 0 then
    raise exception 'invalid_args';
  end if;
  if p_stripe_session_id is null or length(trim(p_stripe_session_id)) = 0 then
    raise exception 'invalid_stripe_session';
  end if;

  if exists (
    select 1 from public.credit_ledger where stripe_session_id = p_stripe_session_id
  ) then
    select credits into saldo from public.profiles where id = p_user_id;
    return coalesce(saldo, 0);
  end if;

  perform set_config('credits.bypass', 'on', true);

  update public.profiles
  set credits = credits + p_quantidade
  where id = p_user_id
  returning credits into saldo;

  if not found then
    raise exception 'profile_not_found';
  end if;

  insert into public.credit_ledger (user_id, delta, reason, ferramenta, stripe_session_id)
  values (p_user_id, p_quantidade, 'compra_stripe', null, p_stripe_session_id);

  return saldo;
end;
$$;

revoke all on function public.adicionar_creditos_compra(uuid, integer, text) from public;
revoke all on function public.adicionar_creditos_compra(uuid, integer, text) from anon, authenticated;
grant execute on function public.adicionar_creditos_compra(uuid, integer, text) to service_role;
