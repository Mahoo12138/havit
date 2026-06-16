-- Migration: Rename item type enum values
-- Renames from old conceptual names to new ones

UPDATE items SET type = 'essentials' WHERE type = 'edc';
UPDATE items SET type = 'predictive_supplies' WHERE type = 'consumable_a';
UPDATE items SET type = 'tracked_spares' WHERE type = 'consumable_b';
