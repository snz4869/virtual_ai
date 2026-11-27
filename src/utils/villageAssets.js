const BASE_SPRITE_KEYS = [
  'grass_tile',
  'road_tile',
  'office_hq',
  'cafe',
  'cowork',
  'station',
  'bookshop',
  'windmill',
  'gallery',
  'villa',
  'greenhouse',
  'homestead',
  'foodtruck',
  'tree_oak',
  'tree_pine',
  'tree_sakura',
  'fountain',
  'villa_garden',
  'basketball_court',
];

const spriteCache = new Map();
let loadStarted = false;
const listeners = new Set();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn(spriteCache);
    } catch {
      // ignore listener errors
    }
  });
}

export function getVillageSprite(key) {
  const img = spriteCache.get(key);
  if (img && img.complete && img.naturalWidth > 0) return img;
  return null;
}

export function getLoadedVillageSprites() {
  const out = {};
  spriteCache.forEach((img, key) => {
    if (img && img.complete && img.naturalWidth > 0) {
      out[key] = img;
    }
  });
  return out;
}

export function loadVillageSprites(onUpdate) {
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return () => {};
  }
  if (onUpdate) {
    listeners.add(onUpdate);
    if (spriteCache.size > 0) {
      onUpdate(spriteCache);
    }
  }

  if (!loadStarted) {
    loadStarted = true;
    BASE_SPRITE_KEYS.forEach((key) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        spriteCache.set(key, img);
        notifyListeners();
      };
      img.onerror = () => {
        // Fallback ke renderer prosedural secara otomatis jika aset tidak ada
      };
      img.src = `/assets/village/${key}.png`;
    });
  }

  return () => {
    if (onUpdate) listeners.delete(onUpdate);
  };
}

export const VILLAGE_SPRITE_KEYS = BASE_SPRITE_KEYS;
