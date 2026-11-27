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

const OFFICE_SPRITE_KEYS = [
  'floor_wood_light',
  'floor_wood_warm',
  'floor_slate_tech',
  'floor_tile_light',
  'rug_blue',
  'rug_green',
  'rug_gold',
  'desk_front',
  'desk_back',
  'desk_vertical',
  'meeting_table',
  'round_table',
  'wood_stool',
  'cafe_counter',
  'bookshelf',
  'laptop_front',
  'laptop_silver',
  'laptop_right',
  'laptop_back',
  'water_cooler',
  'coffee_maker',
  'coffee_cup',
  'copy_machine',
  'tv_widescreen',
  'tv_clean',
  'sink',
  'plant_palm',
  'plant_ficus',
  'server_rack',
  'server_screen',
  'exit_door',
];

const CHARACTER_SPRITE_KEYS = [
  'director',
  // Core & Extra AI Agents
  'npc_tech_lead',
  'npc_developer',
  'npc_qa_lead',
  'npc_fullstack',
  'npc_ui_designer',
  'npc_analyst',
  'npc_copywriter',
  // Ambient Office Staff
  'npc_frontend',
  'npc_product_ops',
  'npc_backend',
  'npc_creative_f',
  'npc_devops',
  'npc_support',
  'npc_account_exec',
  'npc_office_ops',
  'npc_ai_infra',
  'npc_cloud_eng',
  'npc_brand_designer',
  'npc_barista_m',
  // Village Residents
  'npc_villager_bagas',
  'npc_villager_deni',
  'npc_barista_f',
  'npc_maker',
  'npc_booklover',
  'npc_sailor',
  'npc_gardener',
  'npc_painter',
  'npc_athlete',
  'npc_elder_rt',
  'npc_botanist',
  'npc_chef',
  'npc_musician',
  'npc_farmer',
];

const spriteCache = new Map();
const officeSpriteCache = new Map();
const characterSpriteCache = new Map();
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

export function getOfficeSprite(key) {
  if (!key) return null;
  const img = officeSpriteCache.get(key);
  if (img && img.complete && img.naturalWidth > 0) return img;
  return null;
}

export function getCharacterSprite(key) {
  if (!key) return null;
  const img = characterSpriteCache.get(key);
  if (img && img.complete && img.naturalWidth > 0) return img;
  return null;
}

export function getDirectorSprite() {
  return getCharacterSprite('director');
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

    OFFICE_SPRITE_KEYS.forEach((key) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        officeSpriteCache.set(key, img);
        notifyListeners();
      };
      img.onerror = () => {
        // Fallback ke renderer prosedural jika aset interior kantor tidak tersedia
      };
      img.src = `/assets/office/${key}.png`;
    });

    CHARACTER_SPRITE_KEYS.forEach((key) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        characterSpriteCache.set(key, img);
        notifyListeners();
      };
      img.onerror = () => {
        // Fallback ke renderer prosedural jika aset karakter tidak tersedia
      };
      img.src = `/assets/characters/${key}.png`;
    });
  }

  return () => {
    if (onUpdate) listeners.delete(onUpdate);
  };
}

export const VILLAGE_SPRITE_KEYS = BASE_SPRITE_KEYS;
export { OFFICE_SPRITE_KEYS, CHARACTER_SPRITE_KEYS };
