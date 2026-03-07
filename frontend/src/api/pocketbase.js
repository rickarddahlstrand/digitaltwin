const PB_URL = '/pb';

async function pb(path, options = {}) {
  const res = await fetch(`${PB_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `PocketBase ${res.status}`);
  }
  return res.json();
}

export async function getBuilding(osmId) {
  try {
    const data = await pb(
      `/api/collections/buildings/records?filter=(osm_id='${encodeURIComponent(osmId)}')`
    );
    return data.items?.[0] || null;
  } catch {
    return null;
  }
}

export async function saveBuilding(record) {
  const existing = await getBuilding(record.osm_id);
  if (existing) {
    return pb(`/api/collections/buildings/records/${existing.id}`, {
      method: 'PATCH',
      body: JSON.stringify(record),
    });
  }
  return pb('/api/collections/buildings/records', {
    method: 'POST',
    body: JSON.stringify(record),
  });
}

export async function getAllBuildings() {
  try {
    const data = await pb('/api/collections/buildings/records?perPage=200');
    return data.items || [];
  } catch {
    return [];
  }
}

export async function getAllCategories() {
  const buildings = await getAllBuildings();
  const set = new Set();
  buildings.forEach((b) => {
    const cats = b.categories || [];
    if (Array.isArray(cats)) cats.forEach((c) => set.add(c));
  });
  return [...set].sort();
}

export async function deleteBuilding(osmId) {
  const existing = await getBuilding(osmId);
  if (existing) {
    await pb(`/api/collections/buildings/records/${existing.id}`, {
      method: 'DELETE',
    });
  }
}
