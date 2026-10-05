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

// A click on the 3D model opens the equipment the part belongs to, not the single part. The part view stays for: parts that are not
// members of the equipment's own plan (external service details, pipes, supports), clicks while an equipment is explored or exploded,
// a second click on the same part within a short time (double-click), and a click on another part of the equipment whose component
// is already open (the user has drilled down and is moving between its parts).
export function clickTarget({ part, plan, record, selected, exploring, repeated }) {
  if (!part || exploring || repeated) return 'part';
  if (!plan || !record || !plan.ids?.has(part.id) || record.modelId !== plan.equipmentId) return 'part';
  if (selected && Number(selected.reactor) === Number(part.reactor)) return 'part';
  return 'equipment';
}
