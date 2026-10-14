-- WhatsApp nos perfis (kits + futuros usos).
-- Rodar no SQL Editor do Supabase se a coluna ainda não existir.

alter table public.profiles
  add column if not exists whatsapp text;

comment on column public.profiles.whatsapp is
  'WhatsApp em dígitos com DDI 55 (ex.: 5511999999999). Coletado no cadastro dos kits.';
