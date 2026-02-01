import { useState, useCallback } from 'react';
import type { FacetSel, FacetBucket } from '../lib/facets';

export function useFacetSelection() {
  const [selections, setSelections] = useState<FacetSel[]>([]);

  const add = useCallback((bucket: FacetBucket, value: string, op: 'INCLUDE'|'EXCLUDE' = 'INCLUDE') => {
    setSelections(prev => [...prev, { bucket, value, op }]);
  }, []);

  const remove = useCallback((idx: number) => {
    setSelections(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const clear = useCallback(() => setSelections([]), []);

  return { selections, add, remove, clear };
}


