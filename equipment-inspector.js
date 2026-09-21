// The inspector describes the registered asset, never an arbitrary first mesh.
// These extents are the assembled model envelope, not a vessel diameter or rating.
export function equipmentOverview(record, plan) {
  if (!record || !plan || record.modelId !== plan.equipmentId) return null;
  const size = ['x', 'z', 'y'].map(axis => plan.bounds.max[axis] - plan.bounds.min[axis]);
  return {
    tag: record.tag,
    name: record.name,
    areaId: record.areaId,
    kind: record.areaId === 'SHARED' ? 'Shared service overview' : 'Equipment overview',
    duty: record.name,
    description: record.geometryStatus,
    envelope: size.every(v => Number.isFinite(v) && v >= 0)
      ? size.map(v => v.toFixed(2)).join(' × ') + ' m' : 'Not available',
    componentCount: plan.members.length,
    assemblyCount: new Set(plan.members.map(p => p.componentAssembly || p.assembly)).size,
    source: record.source
      ? `${record.source.title} · ${record.source.revision} · draft · PDF page ${record.source.page}. Equipment duty listed; model geometry remains conceptual.`
      : record.basisReference
        ? `Related basis: ${record.basisReference.title} · ${record.basisReference.revision}, PDF page ${record.basisReference.page}. This arrangement is not claimed as PFD-listed.`
        : 'Separately scoped conceptual arrangement.'
  };
}

// Navigation and its counter consume the same scoped, visible list. Isolation
// may hide siblings on screen, but must not make their navigation order vanish.
export function equipmentComponentList(plan, selected, isAvailable) {
  const members = plan?.members || [];
  const result = members.filter(isAvailable);
  // Explicitly picked boundary / service details remain inspectable without
  // silently including the rest of the plant in component navigation.
  if (selected && !plan?.ids.has(selected.id) && isAvailable(selected)) result.push(selected);
  return result;
}
