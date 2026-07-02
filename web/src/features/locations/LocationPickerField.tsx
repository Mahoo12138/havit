import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { IconChevronDown, IconMapPin } from '@tabler/icons-react';

import type { Location } from '../../api/client';
import { Field, FieldError, FieldLabel } from '../../components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '../../components/ui/popover';
import { ScrollArea } from '../../components/ui/scroll-area';
import {
  Tree,
  TreeGroup,
  TreeGroupLabel,
  TreeItem,
  TreeItemChevron,
  TreeItemIcon,
  TreeItemLabel,
} from '../../components/ui/tree';
import { buildIndex, breadcrumbOf, type LocationIndex } from './useLocationsData';
import { getLocationTypeMeta } from './types';
import * as s from './LocationPickerField.css';

const EMPTY_TREE: Location[] = [];

function expandedFor(index: LocationIndex, selectedId: string | null) {
  const expanded = new Set(index.roots.map((root) => root.id));
  let current = selectedId ? index.parentMap.get(selectedId) : undefined;

  while (current) {
    expanded.add(current);
    current = index.parentMap.get(current);
  }

  return expanded;
}

function LocationPickerField({
  label,
  tree,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  id,
  error,
  includeVirtualLocations = true,
}: {
  label: string;
  tree?: Location[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  error?: string | null;
  includeVirtualLocations?: boolean;
}) {
  const { t } = useTranslation();
  const inputId = id ?? label;
  const resolvedTree = useMemo(
    () => (includeVirtualLocations ? tree ?? EMPTY_TREE : (tree ?? EMPTY_TREE).filter((root) => root.type !== 'virtual')),
    [includeVirtualLocations, tree],
  );
  const index = useMemo(() => buildIndex(resolvedTree), [resolvedTree]);
  const selected = value ? index.byId.get(value) ?? null : null;
  const breadcrumb = selected ? breadcrumbOf(index, selected.id) : [];
  const fullPath = breadcrumb.map((node) => node.name).join(' / ');
  const pathText = fullPath || t('assets.locationPickerNoSelection');
  const displayValue = selected?.name ?? placeholder ?? '';
  const selectedMeta = getLocationTypeMeta(selected?.type);
  const SelectedIcon = selected ? selectedMeta.icon : IconMapPin;
  const physicalRoots = index.roots.filter((root) => root.type !== 'virtual');
  const virtualRoots = includeVirtualLocations ? index.roots.filter((root) => root.type === 'virtual') : [];
  const [open, setOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [expanded, setExpanded] = useState(() => expandedFor(index, selected?.id ?? null));

  useEffect(() => {
    setExpanded(expandedFor(index, selected?.id ?? null));
  }, [index, selected?.id]);

  function toggleExpand(nodeId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
      return next;
    });
  }

  function handleSelect(nodeId: string) {
    onChange(nodeId);
    setOpen(false);
    setTooltipOpen(false);
  }

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={inputId}>
        {label}
        {required ? ' *' : null}
      </FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <div
          className={s.control}
          data-disabled={disabled || undefined}
          data-invalid={!!error || undefined}
          data-open={open || undefined}
        >
          <PopoverTrigger
            id={inputId}
            className={s.trigger}
            disabled={disabled}
            aria-expanded={open}
            aria-invalid={!!error}
            aria-required={required}
            aria-label={t('assets.locationPickerOpen')}
            title={fullPath || placeholder}
          >
            <span className={selected ? s.value : s.placeholder}>
              {displayValue}
            </span>
            <IconChevronDown size={15} className={s.chevron} />
          </PopoverTrigger>

          <Popover open={tooltipOpen} onOpenChange={setTooltipOpen}>
            <PopoverTrigger
              type="button"
              className={s.pathButton}
              disabled={disabled}
              aria-label={t('assets.locationPickerPath')}
              title={pathText}
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <SelectedIcon size={16} />
            </PopoverTrigger>
            <PopoverContent className={s.pathTooltip} side="top" align="start" sideOffset={6}>
              {pathText}
            </PopoverContent>
          </Popover>
        </div>

        <PopoverContent className={s.panel} align="start" sideOffset={6}>
          <PopoverHeader className={s.panelHeader}>
            <PopoverTitle>{t('assets.locationPickerTitle')}</PopoverTitle>
            {fullPath && (
              <PopoverDescription className={s.panelPath}>
                {fullPath}
              </PopoverDescription>
            )}
          </PopoverHeader>
          {index.roots.length === 0 ? (
            <div className={s.empty}>
              {includeVirtualLocations ? t('locations.noLocationsHint') : t('assets.locationPickerNoPhysicalLocations')}
            </div>
          ) : (
            <ScrollArea className={s.treeBody}>
              <div className={s.treeInner}>
                <Tree aria-label={t('locations.tree')} indent={14}>
                  {physicalRoots.length > 0 && (
                    <LocationTreeSection
                      label={t('locations.physicalPositions')}
                      nodes={physicalRoots}
                      index={index}
                      expanded={expanded}
                      selectedId={selected?.id ?? null}
                      onSelect={handleSelect}
                      onToggle={toggleExpand}
                    />
                  )}
                  {virtualRoots.length > 0 && (
                    <LocationTreeSection
                      label={t('locations.virtualPositions')}
                      nodes={virtualRoots}
                      index={index}
                      expanded={expanded}
                      selectedId={selected?.id ?? null}
                      onSelect={handleSelect}
                      onToggle={toggleExpand}
                    />
                  )}
                </Tree>
              </div>
            </ScrollArea>
          )}
        </PopoverContent>
      </Popover>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

function LocationTreeSection({
  label,
  nodes,
  index,
  expanded,
  selectedId,
  onSelect,
  onToggle,
}: {
  label: string;
  nodes: Location[];
  index: LocationIndex;
  expanded: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <TreeGroup>
      <TreeGroupLabel>{label}</TreeGroupLabel>
      {nodes.map((node) => (
        <LocationTreeNode
          key={node.id}
          node={node}
          depth={0}
          index={index}
          expanded={expanded}
          selectedId={selectedId}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </TreeGroup>
  );
}

function LocationTreeNode({
  node,
  depth,
  index,
  expanded,
  selectedId,
  onSelect,
  onToggle,
}: {
  node: Location;
  depth: number;
  index: LocationIndex;
  expanded: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const meta = getLocationTypeMeta(node.type);
  const Icon = meta.icon;
  const children = index.childrenMap.get(node.id) ?? [];
  const isExpanded = expanded.has(node.id);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (children.length === 0) return;
    if (event.key === 'ArrowRight' && !isExpanded) {
      event.preventDefault();
      onToggle(node.id);
    }
    if (event.key === 'ArrowLeft' && isExpanded) {
      event.preventDefault();
      onToggle(node.id);
    }
  }

  return (
    <div>
      <TreeItem
        depth={depth}
        selected={selectedId === node.id}
        expanded={isExpanded}
        folder={children.length > 0}
        onClick={() => onSelect(node.id)}
        onKeyDown={handleKeyDown}
      >
        <TreeItemChevron
          expanded={isExpanded}
          empty={children.length === 0}
          onToggle={() => {
            if (children.length > 0) onToggle(node.id);
          }}
        />
        <TreeItemIcon>
          <Icon size={15} />
        </TreeItemIcon>
        <TreeItemLabel>{node.name}</TreeItemLabel>
      </TreeItem>
      {isExpanded && children.map((child) => (
        <LocationTreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          index={index}
          expanded={expanded}
          selectedId={selectedId}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

export { LocationPickerField };
