import { createContext, useContext, type CSSProperties, type HTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import type { ItemInstance, TreeInstance } from '@headless-tree/core';
import { IconChevronRight, IconMinus, IconPlus } from '@tabler/icons-react';

import * as s from './tree.css';

type ToggleIconType = 'chevron' | 'plus-minus';

interface TreeContextValue<T = unknown> {
  indent: number;
  currentItem?: ItemInstance<T>;
  tree?: TreeInstance<T>;
  toggleIconType: ToggleIconType;
}

const TreeContext = createContext<TreeContextValue>({
  indent: 14,
  currentItem: undefined,
  tree: undefined,
  toggleIconType: 'chevron',
});

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

function useTreeContext<T = unknown>() {
  return useContext(TreeContext) as TreeContextValue<T>;
}

interface TreeProps extends HTMLAttributes<HTMLDivElement> {
  indent?: number;
  tree?: TreeInstance<unknown>;
  toggleIconType?: ToggleIconType;
}

function Tree({
  indent = 14,
  tree,
  className,
  style,
  toggleIconType = 'chevron',
  ...props
}: TreeProps) {
  const containerProps = tree?.getContainerProps?.() ?? {};
  const mergedProps = mergeProps<'div'>(containerProps, props);
  const { style: containerStyle, ...otherProps } = mergedProps;
  const mergedStyle = {
    ...containerStyle,
    ...style,
    '--tree-indent': `${indent}px`,
  } as CSSProperties;

  return (
    <TreeContext.Provider value={{ indent, tree, toggleIconType }}>
      <div
        role="tree"
        data-slot="tree"
        style={mergedStyle}
        className={cx(s.root, className)}
        {...otherProps}
      />
    </TreeContext.Provider>
  );
}

function TreeGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="group" data-slot="tree-group" className={cx(s.group, className)} {...props} />;
}

function TreeGroupLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="tree-group-label" className={cx(s.groupLabel, className)} {...props} />;
}

interface TreeItemProps<T = unknown> extends Omit<useRender.ComponentProps<'button'>, 'indent'> {
  item?: ItemInstance<T>;
  depth?: number;
  selected?: boolean;
  expanded?: boolean;
  folder?: boolean;
  disabled?: boolean;
  dragTarget?: boolean;
  searchMatch?: boolean;
}

function TreeItem<T = unknown>({
  item,
  depth,
  selected,
  expanded,
  folder,
  disabled,
  dragTarget,
  searchMatch,
  className,
  style,
  render,
  children,
  ...props
}: TreeItemProps<T>) {
  const parentContext = useTreeContext<T>();
  const level = depth ?? item?.getItemMeta?.().level ?? 0;
  const itemProps = item?.getProps?.() ?? {};
  const itemExpanded = expanded ?? item?.isExpanded?.() ?? false;
  const itemFolder = folder ?? item?.isFolder?.() ?? false;
  const itemSelected = selected ?? item?.isSelected?.() ?? false;
  const itemDragTarget = dragTarget ?? item?.isDragTarget?.() ?? false;
  const itemSearchMatch = searchMatch ?? item?.isMatchingSearch?.() ?? false;
  const itemFocused = item?.isFocused?.() ?? undefined;
  const mergedProps = mergeProps<'button'>(
    {
      type: 'button',
      role: 'treeitem',
      'aria-expanded': itemFolder ? itemExpanded : undefined,
      disabled,
    },
    itemProps,
    props,
  );
  const { style: itemStyle, ...otherProps } = mergedProps;
  const mergedStyle = {
    ...itemStyle,
    ...style,
    '--tree-item-depth': level,
  } as CSSProperties;

  return (
    <TreeContext.Provider value={{ ...parentContext, currentItem: item }}>
      {useRender({
        defaultTagName: 'button',
        render,
        props: mergeProps<'button'>(
          {
            'data-slot': 'tree-item',
            'data-focus': itemFocused || undefined,
            'data-folder': itemFolder || undefined,
            'data-selected': itemSelected || undefined,
            'data-drag-target': itemDragTarget || undefined,
            'data-search-match': itemSearchMatch || undefined,
            'data-disabled': disabled || undefined,
            style: mergedStyle,
            className: cx(s.item, className),
            children,
          },
          otherProps,
        ),
      })}
    </TreeContext.Provider>
  );
}

interface TreeItemChevronProps extends HTMLAttributes<HTMLSpanElement> {
  expanded?: boolean;
  empty?: boolean;
  onToggle?: (event: MouseEvent<HTMLSpanElement>) => void;
}

function TreeItemChevron({
  expanded,
  empty,
  onToggle,
  className,
  onClick,
  ...props
}: TreeItemChevronProps) {
  return (
    <span
      data-slot="tree-item-chevron"
      data-expanded={expanded || undefined}
      data-empty={empty || undefined}
      className={cx(s.chevron, className)}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        event.stopPropagation();
        onToggle?.(event);
      }}
      {...props}
    >
      <IconChevronRight size={13} />
    </span>
  );
}

function TreeItemIcon({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span data-slot="tree-item-icon" className={cx(s.itemIcon, className)} {...props} />;
}

interface TreeItemLabelProps<T = unknown> extends HTMLAttributes<HTMLSpanElement> {
  item?: ItemInstance<T>;
}

function TreeItemLabel<T = unknown>({
  item: propItem,
  children,
  className,
  ...props
}: TreeItemLabelProps<T>) {
  const { currentItem, toggleIconType } = useTreeContext<T>();
  const item = propItem || currentItem;
  const isFolder = item?.isFolder?.() ?? false;
  const isExpanded = item?.isExpanded?.() ?? false;

  return (
    <span data-slot="tree-item-label" className={cx(s.label, className)} {...props}>
      {isFolder && toggleIconType === 'plus-minus' && (
        isExpanded ? <IconMinus size={14} strokeWidth={1.5} /> : <IconPlus size={14} strokeWidth={1.5} />
      )}
      {children ?? item?.getItemName?.() ?? null}
    </span>
  );
}

function TreeItemCount({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span data-slot="tree-item-count" className={cx(s.count, className)} {...props} />;
}

function TreeDragLine({ className, style, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { tree } = useTreeContext();
  const dragLine = tree?.getDragLineStyle?.();
  if (!dragLine) return null;

  return (
    <div
      data-slot="tree-drag-line"
      style={{ ...dragLine, ...style }}
      className={cx(s.dragLine, className)}
      {...props}
    />
  );
}

export {
  AssistiveTreeDescription,
  useTree,
} from '@headless-tree/react';

export type {
  ItemInstance,
  TreeInstance,
} from '@headless-tree/core';

export {
  Tree,
  TreeGroup,
  TreeGroupLabel,
  TreeItem,
  TreeItemChevron,
  TreeItemCount,
  TreeItemIcon,
  TreeItemLabel,
  TreeDragLine,
};
