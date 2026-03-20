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

export const parseGoogleTakeout = (json: any): Place[] => {
  const places: Place[] = [];
  const features = json?.features || (Array.isArray(json) ? json : null);
  if (!Array.isArray(features)) return places;

  features.forEach((f: any) => {
    if (!f) return;
    const props = f.properties || f.Properties || {};
    const geo = f?.geometry?.coordinates;
    const location = props.location || {};
    const name = location.name || props.name || props.Name || props.Title || props.title || '';
    if (!name) return;
    const address = location.address || props.address || props.Address || props['住所'] || '';
    const url = props.google_maps_url || props['Google Maps URL'] || props.url || props.URL || '';
    const hasCoords = geo && !(geo[0] === 0 && geo[1] === 0);
    places.push({
      id: crypto.randomUUID(),
      name,
      address,
      category: '',
      tags: [],
      memo: '',
      url,
      lat: hasCoords ? geo[1] : undefined,
      lng: hasCoords ? geo[0] : undefined,
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
