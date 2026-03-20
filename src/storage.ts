import { Place } from './types';

const KEY = 'mapmemo_places';

export const loadPlaces = (): Place[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const savePlaces = (places: Place[]) => {
  localStorage.setItem(KEY, JSON.stringify(places));
};

// GoogleテイクアウトのJSONをパース
export const parseGoogleTakeout = (json: any): Place[] => {
  const places: Place[] = [];

  // Googleテイクアウトの形式: { features: [...] } または直接配列
  const features = json?.features || json;
  if (!Array.isArray(features)) return places;

  features.forEach((f: any) => {
    const props = f?.properties || {};
    const geo = f?.geometry?.coordinates;
    const name = props?.Title || props?.name || '名称不明';
    const address = props?.Address || props?.address || '';
    const url = props?.['Google Maps URL'] || props?.url || '';

    places.push({
      id: crypto.randomUUID(),
      name,
      address,
      category: '',
      tags: [],
      memo: '',
      url,
      lat: geo ? geo[1] : undefined,
      lng: geo ? geo[0] : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  return places;
};

export const getAllCategories = (places: Place[]): string[] => {
  const set = new Set(places.map(p => p.category).filter(Boolean));
  return Array.from(set).sort();
};

export const getAllTags = (places: Place[]): string[] => {
  const set = new Set(places.flatMap(p => p.tags));
  return Array.from(set).sort();
};
