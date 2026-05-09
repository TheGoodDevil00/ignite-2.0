begin;

alter table public.teams
  add column if not exists contact_detail text;

notify pgrst, 'reload schema';

commit;
