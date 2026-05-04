const BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

async function parseJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function createCat(payload) {
  const res = await fetch(`${BASE}/cats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error?.message || data.error || res.statusText);
  return data;
}

export async function getRecommendations(catId) {
  const res = await fetch(`${BASE}/recommendations/${catId}`);
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}
