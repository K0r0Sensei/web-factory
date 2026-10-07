import type { Lead } from '../types/leads';

type DiscoveryProvider = 'auto' | 'dataforseo' | 'osm';

type DiscoveryParams = {
  niche: string;
  location: string;
  limit: number;
  provider?: DiscoveryProvider;
};

type GeocodeResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
  boundingbox?: [string, string, string, string];
};

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
const DATAFORSEO_URL = 'https://api.dataforseo.com/v3/business_data/business_listings/search/live';

const NICHE_MAP: Record<string, { osmTag: string; keywords: string[] }> = {
  fontaneros: { osmTag: 'plumber', keywords: ['fontanero', 'fontanería', 'plumber'] },
  fontanero: { osmTag: 'plumber', keywords: ['fontanero', 'fontanería', 'plumber'] },
  electricistas: { osmTag: 'electrician', keywords: ['electricista', 'electricidad', 'electrician'] },
  electricista: { osmTag: 'electrician', keywords: ['electricista', 'electricidad', 'electrician'] },
  climatizacion: { osmTag: 'hvac', keywords: ['climatización', 'aire acondicionado', 'hvac'] },
  'climatización': { osmTag: 'hvac', keywords: ['climatización', 'aire acondicionado', 'hvac'] },
  carpinteros: { osmTag: 'carpenter', keywords: ['carpintero', 'carpintería', 'carpenter'] },
  carpintero: { osmTag: 'carpenter', keywords: ['carpintero', 'carpintería', 'carpenter'] },
};

function normalizeNiche(value: string) {
  return value.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function slug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'negocio';
}

function clampLimit(value: number) {
  return Math.max(1, Math.min(20, Math.floor(Number(value) || 10)));
}

function userAgent() {
  return process.env.DISCOVERY_USER_AGENT || 'WebFactoryDiscovery/0.1 (+local prospect research)';
}

async function geocodeLocation(location: string) {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', location);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'es');
  const response = await fetch(url, {
    headers: { 'User-Agent': userAgent(), Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`No se pudo localizar “${location}” (Nominatim HTTP ${response.status}).`);
  const results = await response.json() as GeocodeResult[];
  const first = results[0];
  if (!first?.lat || !first?.lon || !first.boundingbox) {
    throw new Error(`No encontré una ubicación válida para “${location}”.`);
  }
  const [south, north, west, east] = first.boundingbox.map(Number);
  return {
    lat: Number(first.lat),
    lon: Number(first.lon),
    bbox: { south, west, north, east },
    displayName: first.display_name || location,
  };
}

function osmLeadFromElement(element: any, city: string, niche: string, index: number): Lead | null {
  const tags = element?.tags || {};
  const name = String(tags.name || tags.operator || '').trim();
  if (!name) return null;
  const phone = String(tags['contact:phone'] || tags.phone || '').trim();
  const website = String(tags['contact:website'] || tags.website || '').trim();
  const addressParts = [tags['addr:street'], tags['addr:housenumber'], tags['addr:postcode'], tags['addr:city'] || city]
    .filter(Boolean).join(', ');
  const coordinates = element?.lat != null && element?.lon != null
    ? [Number(element.lat), Number(element.lon)]
    : element?.center?.lat != null && element?.center?.lon != null
      ? [Number(element.center.lat), Number(element.center.lon)]
      : undefined;
  const rating = undefined;
  const description = tags.description ? String(tags.description) : `${niche} local en ${city}.`;
  const serviceAreas = [city];
  const services = (niche === 'fontaneros' || niche === 'fontanero')
    ? ['Fontanería', 'Urgencias', 'Desatascos', 'Fugas']
    : (niche === 'electricistas' || niche === 'electricista')
      ? ['Electricidad', 'Averías', 'Instalaciones', 'Mantenimiento']
      : [niche, 'Presupuesto', 'Mantenimiento'];
  return {
    id: `${slug(name)}-${index + 1}`,
    businessName: name,
    city: String(tags['addr:city'] || city),
    phone,
    website: website || undefined,
    description,
    services,
    serviceAreas,
    status: 'new',
    ...(coordinates ? { _coordinates: coordinates } : {}),
    _source: 'OpenStreetMap',
    _address: addressParts || undefined,
  } as unknown as Lead;
}

async function discoverFromOsm(niche: string, location: string, limit: number) {
  const key = normalizeNiche(niche);
  const mapped = NICHE_MAP[key];
  if (!mapped) throw new Error(`El modo OSM solo admite: ${Object.keys(NICHE_MAP).filter((x) => x === normalizeNiche(x)).slice(0, 6).join(', ')}.`);
  const geo = await geocodeLocation(location);
  const bbox = `${geo.bbox.south},${geo.bbox.west},${geo.bbox.north},${geo.bbox.east}`;
  const query = `[out:json][timeout:25];nwr["craft"="${mapped.osmTag}"](${bbox});out center tags;`;
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'text/plain', 'User-Agent': userAgent(), Accept: 'application/json' },
    body: query,
  });
  if (!response.ok) throw new Error(`Overpass devolvió HTTP ${response.status}.`);
  const payload = await response.json() as { elements?: any[] };
  const leads = (payload.elements || []).map((item, index) => osmLeadFromElement(item, location, key, index)).filter(Boolean) as Lead[];
  return {
    provider: 'osm' as const,
    displayLocation: geo.displayName,
    leads: leads.slice(0, limit),
    note: 'Fuente experimental: OpenStreetMap. Incluye atribución en la interfaz y está pensada para búsquedas iniciadas por el usuario, no para extracción continua a gran escala.',
  };
}

function dataForSeoAuth() {
  const login = process.env.DATAFORSEO_LOGIN?.trim();
  const password = process.env.DATAFORSEO_PASSWORD?.trim();
  if (!login || !password) return null;
  return `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`;
}

async function discoverFromDataForSeo(niche: string, location: string, limit: number) {
  const auth = dataForSeoAuth();
  if (!auth) throw new Error('DATAFORSEO_LOGIN y DATAFORSEO_PASSWORD no están configurados.');
  const geo = await geocodeLocation(location);
  const key = normalizeNiche(niche);
  const task = {
    title: niche,
    description: niche,
    location_coordinate: `${geo.lat.toFixed(6)},${geo.lon.toFixed(6)},${Math.min(100, Math.max(5, Math.ceil(Math.max(geo.bbox.north - geo.bbox.south, geo.bbox.east - geo.bbox.west) * 55)))}`,
    order_by: ['rating.value,desc', 'rating.votes_count,desc'],
    limit: clampLimit(limit),
  };
  const response = await fetch(DATAFORSEO_URL, {
    method: 'POST',
    cache: 'no-store',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify([task]),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.status_message || `DataForSEO HTTP ${response.status}.`);
  const taskResult = payload?.tasks?.[0];
  if (!taskResult || taskResult.status_code !== 20000) {
    throw new Error(taskResult?.status_message || payload?.status_message || 'DataForSEO no devolvió resultados.');
  }
  const items = taskResult?.result?.[0]?.items || [];
  const leads: Lead[] = items
    .filter((item: any) => item?.type === 'business_listing' && item?.title)
    .map((item: any, index: number) => ({
      id: item.place_id ? `place-${item.place_id}` : `${slug(item.title)}-${index + 1}`,
      businessName: String(item.title),
      city: String(item.address_info?.city || location),
      province: item.address_info?.region ? String(item.address_info.region) : undefined,
      phone: String(item.phone || ''),
      website: item.url ? String(item.url) : undefined,
      description: item.description ? String(item.description) : undefined,
      services: [String(item.category || niche)].filter(Boolean).slice(0, 1).concat(['Presupuesto', 'Servicio profesional']),
      serviceAreas: [String(item.address_info?.city || location)],
      rating: typeof item.rating?.value === 'number' ? Number(item.rating.value) : undefined,
      reviewsCount: typeof item.rating?.votes_count === 'number' ? Number(item.rating.votes_count) : undefined,
      status: 'new',
      _source: 'DataForSEO',
      _cost: taskResult.cost,
      _checkUrl: item.check_url,
      _placeId: item.place_id,
      _niche: key,
    } as unknown as Lead));
  return {
    provider: 'dataforseo' as const,
    displayLocation: geo.displayName,
    leads: leads.slice(0, limit),
    note: 'Fuente comercial opcional: DataForSEO Business Listings. Revisa costes y condiciones del proveedor antes de automatizar volumen.',
    cost: Number(taskResult.cost || 0),
  };
}

export async function discoverBusinesses(params: DiscoveryParams) {
  const niche = String(params.niche || '').trim();
  const location = String(params.location || '').trim();
  const limit = clampLimit(params.limit);
  if (!niche || !location) throw new Error('Necesitamos nicho y ciudad/ubicación.');
  const provider = params.provider || 'auto';

  if (provider === 'dataforseo') return discoverFromDataForSeo(niche, location, limit);
  if (provider === 'osm') return discoverFromOsm(niche, location, limit);

  if (dataForSeoAuth()) {
    try { return await discoverFromDataForSeo(niche, location, limit); } catch (error) {
      if (/DATAFORSEO|no están configurados/i.test(error instanceof Error ? error.message : '')) throw error;
    }
  }
  return discoverFromOsm(niche, location, limit);
}
