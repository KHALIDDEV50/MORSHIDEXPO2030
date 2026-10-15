'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  computeProgress,
  deriveStops,
  nextStopId,
  removeStop,
  restoreStop,
  toggleCompleted,
  type TripStopContent,
} from '@/entities/plan';

/**
 * Local trip state for the trip-details panel. In the app this state comes from the plan
 * repository (D-019 single source of truth); the derivation is identical.
 */
export function useTripState(initial: TripStopContent[], { initialCurrentId, now }: { initialCurrentId: string | null; now: string | null }) {
  const [stops, setStops] = useState(initial);
  const [currentId, setCurrentId] = useState<string | null>(initialCurrentId);
  const [selectedId, setSelectedId] = useState<string | null>(initialCurrentId);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(initialCurrentId ? [initialCurrentId] : []));

  const derived = useMemo(() => deriveStops(stops, { currentId, now }), [stops, currentId, now]);
  const progress = useMemo(() => computeProgress(derived), [derived]);

  /** Last stop reached: the current stop, else the last completed one (drives the solid route part). */
  const progressIndex = useMemo(() => {
    const current = derived.findIndex((s) => s.status === 'current');
    if (current >= 0) return current;
    let last = 0;
    derived.forEach((s, i) => {
      if (s.completed) last = i;
    });
    return last;
  }, [derived]);

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const select = useCallback((id: string) => {
    setSelectedId(id);
    setExpanded((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const toggleComplete = useCallback(
    (id: string) => {
      setStops((prev) => toggleCompleted(prev, id));
      // Completing the current stop releases it; the visitor picks the next one
      if (currentId === id) setCurrentId(null);
    },
    [currentId],
  );

  const setCurrent = useCallback((id: string) => {
    setCurrentId(id);
    setSelectedId(id);
  }, []);

  /** Removes a stop and returns an undo function (route line, numbering and progress update automatically). */
  const remove = useCallback(
    (id: string) => {
      const index = stops.findIndex((s) => s.id === id);
      const removed = stops[index];
      if (!removed) return null;
      setStops((prev) => removeStop(prev, id));
      if (currentId === id) setCurrentId(null);
      if (selectedId === id) setSelectedId(null);
      return () => setStops((prev) => (prev.some((s) => s.id === id) ? prev : restoreStop(prev, removed, index)));
    },
    [stops, currentId, selectedId],
  );

  return {
    stops: derived,
    progress,
    progressIndex,
    currentId,
    selectedId,
    expanded,
    suggestedNextId: nextStopId(derived),
    select,
    toggleExpanded,
    toggleComplete,
    setCurrent,
    remove,
  };
}
