import {
  IconBuildingSkyscraper,
  IconBox,
  IconArmchair2,
  IconPackage,
  IconCircles,
  type Icon,
} from '@tabler/icons-react';

export type LocationType = 'property' | 'room' | 'furniture' | 'container' | 'virtual';

export interface LocationTypeMeta {
  value: LocationType;
  label: string;
  desc: string;
  icon: Icon;
  /** Hierarchy rank. -1 means virtual (no constraint). */
  rank: number;
  /** Tone key for UI tinting. */
  tone: 'teal' | 'info' | 'warning' | 'violet' | 'amber';
}

export const LOCATION_TYPES: readonly LocationTypeMeta[] = [
  {
    value: 'property',
    label: 'property',
    desc: '',
    icon: IconBuildingSkyscraper,
    rank: 0,
    tone: 'violet',
  },
  {
    value: 'room',
    label: 'room',
    desc: '',
    icon: IconBox,
    rank: 1,
    tone: 'info',
  },
  {
    value: 'furniture',
    label: 'furniture',
    desc: '',
    icon: IconArmchair2,
    rank: 2,
    tone: 'amber',
  },
  {
    value: 'container',
    label: 'container',
    desc: '',
    icon: IconPackage,
    rank: 3,
    tone: 'teal',
  },
  {
    value: 'virtual',
    label: 'virtual',
    desc: '',
    icon: IconCircles,
    rank: -1,
    tone: 'warning',
  },
] as const;

const TYPE_INDEX: Record<string, LocationTypeMeta> = LOCATION_TYPES.reduce(
  (acc, t) => {
    acc[t.value] = t;
    return acc;
  },
  {} as Record<string, LocationTypeMeta>,
);

export function getLocationTypeMeta(type: string | undefined): LocationTypeMeta {
  return TYPE_INDEX[type ?? 'room'] ?? TYPE_INDEX.room;
}

/**
 * Mirrors backend rule: a child must have rank strictly greater than parent.
 * virtual (rank -1) is exempt from the constraint in either role.
 */
export function canNestUnder(parentType: string, childType: string): boolean {
  const p = TYPE_INDEX[parentType];
  const c = TYPE_INDEX[childType];
  if (!p || !c) return false;
  if (p.rank < 0 || c.rank < 0) return true;
  return c.rank > p.rank;
}

/** Allowed child types for the given parent type (or null = root). */
export function allowedChildTypes(parentType: string | null | undefined): LocationType[] {
  if (!parentType) {
    return LOCATION_TYPES.map((t) => t.value);
  }
  return LOCATION_TYPES.filter((t) => canNestUnder(parentType, t.value)).map(
    (t) => t.value,
  );
}
