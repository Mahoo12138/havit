import { SelectField } from './select-field';

export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
}

function flattenTree(nodes: TreeNode[], depth = 0): Array<{ value: string; label: string }> {
  return nodes.flatMap((node) => [
    { value: node.id, label: `${'\u00a0\u00a0'.repeat(depth)}${node.name}` },
    ...flattenTree(node.children ?? [], depth + 1),
  ]);
}

function TreeSelectField({
  label,
  tree,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  id,
}: {
  label: string;
  tree: TreeNode[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <SelectField
      id={id}
      label={label}
      options={flattenTree(tree)}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
    />
  );
}

export { TreeSelectField };
