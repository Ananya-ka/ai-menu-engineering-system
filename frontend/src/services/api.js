const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '') + '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to connect to backend service');
  return res.json();
}

export async function fetchOverview() {
  const res = await fetch(`${API_BASE}/overview`);
  if (!res.ok) throw new Error('Failed to fetch overview metrics');
  return res.json();
}

export async function fetchItems(params = {}) {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'All') query.append('category', params.category);
  if (params.quadrant && params.quadrant !== 'All') query.append('quadrant', params.quadrant);
  if (params.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE}/items?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch menu items');
  return res.json();
}

export async function fetchMatrixData() {
  const res = await fetch(`${API_BASE}/matrix`);
  if (!res.ok) throw new Error('Failed to fetch BCG matrix data');
  return res.json();
}

export async function fetchItemHistory(itemId) {
  const res = await fetch(`${API_BASE}/items/${itemId}/history`);
  if (!res.ok) throw new Error(`Failed to fetch history for item ${itemId}`);
  return res.json();
}

export async function simulatePrice(itemId, newPrice) {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item_id: itemId, new_price: Number(newPrice) })
  });
  if (!res.ok) throw new Error('Failed to run price elasticity simulation');
  return res.json();
}

export async function sendAnalystQuery(query) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to process analyst query');
  }
  return res.json();
}
