-- +goose Up

UPDATE categories SET is_system = 0 WHERE is_system <> 0;

-- +goose Down

UPDATE categories
SET is_system = 1
WHERE id IN (
  'cat_furniture',
  'cat_appliances',
  'cat_digital_hw',
  'cat_clothing',
  'cat_medical',
  'cat_games',
  'cat_ebooks',
  'cat_software'
);
