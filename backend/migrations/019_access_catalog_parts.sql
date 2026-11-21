-- 019: allow parts as first-class nodes in the automatically discovered book tree.
-- Additive only; no existing rules or resource rows are changed.
ALTER TABLE access_resources DROP CONSTRAINT IF EXISTS access_resources_resource_type_check;
ALTER TABLE access_resources ADD CONSTRAINT access_resources_resource_type_check
    CHECK (resource_type IN ('section', 'page', 'panel', 'book', 'volume', 'part', 'chapter', 'character', 'video', 'track', 'community_item', 'other'));
