const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;
const BASE_URL = 'https://api.giphy.com/v1/gifs';

export function isGiphyConfigured() {
  return Boolean(GIPHY_API_KEY);
}

async function callGiphy(path, params) {
  if (!GIPHY_API_KEY) {
    throw new Error('尚未設定 GIPHY API Key');
  }
  const usp = new URLSearchParams({ api_key: GIPHY_API_KEY, ...params });
  const res = await fetch(`${BASE_URL}${path}?${usp.toString()}`);
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`GIPHY API 回傳 ${res.status}：${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  return data?.data || [];
}

export function searchGifs(query, { limit = 24, offset = 0 } = {}) {
  return callGiphy('/search', {
    q: query,
    limit: String(limit),
    offset: String(offset),
    rating: 'g',
    lang: 'zh-tw',
    bundle: 'messaging_non_clips',
  });
}

export function getTrendingGifs({ limit = 24 } = {}) {
  return callGiphy('/trending', {
    limit: String(limit),
    rating: 'g',
    bundle: 'messaging_non_clips',
  });
}
