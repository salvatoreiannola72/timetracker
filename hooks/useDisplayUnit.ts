import { useCallback, useState } from 'react';

export type DisplayUnit = 'hours' | 'days';

const HOURS_PER_DAY = 8;

export const useDisplayUnit = (initialUnit: DisplayUnit = 'hours') => {
  const [displayUnit, setDisplayUnit] = useState<DisplayUnit>(initialUnit);

  const formatHours = useCallback(
  (hours: number, short: boolean = false): string => {
    const value =
      displayUnit === 'days' ? hours / HOURS_PER_DAY : hours;

    const formatted = value.toFixed(1);

    if (displayUnit === 'days') {
      return short
        ? `${formatted}g`
        : `${formatted} ${value === 1 ? 'giorno' : 'giorni'}`;
    }

    return short
      ? `${formatted}h`
      : `${formatted} ${value === 1 ? 'ora' : 'ore'}`;
  },
  [displayUnit]
);

  return {
    displayUnit,
    setDisplayUnit,
    formatHours
  };
};
