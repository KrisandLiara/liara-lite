-- Add memory relationship support
create table if not exists memory_relationships (
  id uuid primary key default uuid_generate_v4(),
  source_memory_id uuid references memories(id) on delete cascade,
  target_memory_id uuid references memories(id) on delete cascade,
  relationship_type text not null,
  strength float default 1.0,
  created_at timestamptz default now(),
  metadata jsonb,
  unique(source_memory_id, target_memory_id, relationship_type)
);

-- Add index for relationship lookups
create index if not exists memory_relationships_source_idx 
on memory_relationships(source_memory_id);

create index if not exists memory_relationships_target_idx 
on memory_relationships(target_memory_id);

-- Add function to get related memories
-- create or replace function get_related_memories(
--   memory_id uuid,
--   relationship_type text default null,
--   limit_count int default 10
-- )
-- returns table (
--   id uuid,
--   content text,
--   relationship_type text,
--   strength float
-- )
-- language plpgsql
-- as $$
-- begin
--   return query
--   select
--     m.id,
--     m.full_text as content,
--     r.relationship_type,
--     r.strength
--   from memory_relationships r
--   join memories m on m.id = r.target_memory_id
--   where r.source_memory_id = memory_id
--     and (relationship_type is null or r.relationship_type = relationship_type)
--   order by r.strength desc
--   limit limit_count;
-- end;
-- $$;

-- Add type column to memories (ensure default is set)
alter table memories 
add column if not exists type text DEFAULT 'semantic';

-- Ensure the type column has the default if it already exists
-- This is a bit more explicit to ensure the default is applied
-- to the existing column if it was created without one by the main schema migration.
ALTER TABLE memories ALTER COLUMN type SET DEFAULT 'semantic';
