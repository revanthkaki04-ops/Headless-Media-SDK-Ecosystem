/**
 * @file packages/media-core/src/index.ts
 * @description Pure TypeScript core SDK for Pexels API.
 * NO DOM OR REACT IMPORTS ALLOWED IN THIS PACKAGE.
 */

// ==========================================
// PEXELS API TYPES & CONTRACTS
// ==========================================

export interface PexelsPhotoSource {
  original: string;
  large2x: string;
  large: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
}

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: PexelsPhotoSource;
  liked: boolean;
  alt: string;
  type?: 'photo';
}

export interface PexelsVideoFile {
  id: number;
  quality: 'hd' | 'sd' | 'hls';
  file_type: string;
  width: number;
  height: number;
  fps: number;
  link: string;
}

export interface PexelsVideoPicture {
  id: number;
  picture: string;
  nr: number;
}

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: PexelsVideoFile[];
  video_pictures: PexelsVideoPicture[];
  type?: 'video';
}

export type PexelsMediaItem = PexelsPhoto | PexelsVideo;

export interface PexelsSearchResponse {
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  total_results: number;
  next_page?: string;
  prev_page?: string;
}

export interface PexelsTrendingResponse {
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
  prev_page?: string;
}

export interface PexelsVideoSearchResponse {
  page: number;
  per_page: number;
  videos: PexelsVideo[];
  total_results: number;
  next_page?: string;
  prev_page?: string;
}

export interface SearchOptions {
  page?: number;
  perPage?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'large' | 'medium' | 'small';
  color?: string;
  locale?: string;
}

export interface TrendingOptions {
  page?: number;
  perPage?: number;
}

// ==========================================
// EVENT EMITTER PATTERN
// ==========================================

export type SDKEventType = 'view' | 'download' | string;

export interface SDKEventPayloadMap {
  view: { media: PexelsMediaItem; timestamp: number };
  download: { media: PexelsMediaItem; quality?: string; timestamp: number };
  [key: string]: unknown;
}

export type SDKEventCallback<T = unknown> = (payload: T) => void;

export class SDKEventEmitter {
  private listeners: Map<string, Set<SDKEventCallback<any>>> = new Map();

  constructor() {
    // Default fallback listeners for standard events (logging to console)
    this.on('view', (payload) => {
      console.log('[MediaSDK:Event] Media Viewed:', payload);
    });

    this.on('download', (payload) => {
      console.log('[MediaSDK:Event] Media Downloaded:', payload);
    });
  }

  public on<K extends string>(
    event: K,
    callback: SDKEventCallback<K extends keyof SDKEventPayloadMap ? SDKEventPayloadMap[K] : any>
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  public off<K extends string>(
    event: K,
    callback: SDKEventCallback<K extends keyof SDKEventPayloadMap ? SDKEventPayloadMap[K] : any>
  ): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  public emit<K extends string>(
    event: K,
    payload: K extends keyof SDKEventPayloadMap ? SDKEventPayloadMap[K] : any
  ): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[MediaSDK:Event] Listener error on event "${event}":`, err);
        }
      });
    }
  }
}

// ==========================================
// IN-MEMORY CACHE
// ==========================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class InMemoryCache {
  private store = new Map<string, CacheEntry<any>>();
  private defaultTtlMs: number;

  constructor(defaultTtlMs: number = 1000 * 60 * 5) {
    // 5-minute default TTL
    this.defaultTtlMs = defaultTtlMs;
  }

  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  public set<T>(key: string, data: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.store.set(key, { data, expiresAt });
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  public clear(): void {
    this.store.clear();
  }
}

// ==========================================
// CLIENT INITIALIZATION OPTIONS
// ==========================================

export interface PexelsClientOptions {
  apiKey: string;
  baseUrl?: string;
  cacheTtlMs?: number;
}

// ==========================================
// MAIN PEXELS CLIENT
// ==========================================

export class PexelsClient {
  private apiKey: string;
  private baseUrl: string;
  public events: SDKEventEmitter;
  private cache: InMemoryCache;

  constructor(options: PexelsClientOptions) {
    if (!options.apiKey) {
      throw new Error('[PexelsClient] API key is required for initialization.');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? 'https://api.pexels.com/v1';
    this.events = new SDKEventEmitter();
    this.cache = new InMemoryCache(options.cacheTtlMs);
  }

  private async request<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const cacheKey = url.toString();
    const cachedData = this.cache.get<T>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: this.apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`[PexelsClient] Request failed with status ${response.status}: ${errorText}`);
    }

    const data: T = await response.json();
    this.cache.set(cacheKey, data);
    return data;
  }

  public async search(query: string, options?: SearchOptions): Promise<PexelsSearchResponse> {
    if (!query || query.trim() === '') {
      return { page: 1, per_page: options?.perPage ?? 15, photos: [], total_results: 0 };
    }

    return this.request<PexelsSearchResponse>('/search', {
      query: query.trim(),
      page: options?.page ?? 1,
      per_page: options?.perPage ?? 15,
      orientation: options?.orientation,
      size: options?.size,
      color: options?.color,
      locale: options?.locale,
    });
  }

  public async getTrending(options?: TrendingOptions): Promise<PexelsTrendingResponse> {
    return this.request<PexelsTrendingResponse>('/curated', {
      page: options?.page ?? 1,
      per_page: options?.perPage ?? 15,
    });
  }

  public async getMedia(id: number | string): Promise<PexelsPhoto> {
    return this.request<PexelsPhoto>(`/photos/${id}`);
  }

  public async searchVideos(query: string, options?: SearchOptions): Promise<PexelsVideoSearchResponse> {
    if (!query || query.trim() === '') {
      return { page: 1, per_page: options?.perPage ?? 15, videos: [], total_results: 0 };
    }

    const videoBase = 'https://api.pexels.com/videos';
    const url = new URL(`${videoBase}/search`);
    url.searchParams.append('query', query.trim());
    url.searchParams.append('page', String(options?.page ?? 1));
    url.searchParams.append('per_page', String(options?.perPage ?? 15));

    const cacheKey = url.toString();
    const cachedData = this.cache.get<PexelsVideoSearchResponse>(cacheKey);
    if (cachedData) return cachedData;

    const response = await fetch(url.toString(), {
      headers: { Authorization: this.apiKey },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`[PexelsClient] Video search failed with status ${response.status}: ${errorText}`);
    }

    const data: PexelsVideoSearchResponse = await response.json();
    this.cache.set(cacheKey, data);
    return data;
  }

  public async getPopularVideos(options?: TrendingOptions): Promise<PexelsVideoSearchResponse> {
    const videoBase = 'https://api.pexels.com/videos';
    const url = new URL(`${videoBase}/popular`);
    url.searchParams.append('page', String(options?.page ?? 1));
    url.searchParams.append('per_page', String(options?.perPage ?? 15));

    const cacheKey = url.toString();
    const cachedData = this.cache.get<PexelsVideoSearchResponse>(cacheKey);
    if (cachedData) return cachedData;

    const response = await fetch(url.toString(), {
      headers: { Authorization: this.apiKey },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`[PexelsClient] Popular video request failed with status ${response.status}: ${errorText}`);
    }

    const data: PexelsVideoSearchResponse = await response.json();
    this.cache.set(cacheKey, data);
    return data;
  }

  // Event Helper shortcuts
  public on<K extends string>(
    event: K,
    callback: SDKEventCallback<K extends keyof SDKEventPayloadMap ? SDKEventPayloadMap[K] : any>
  ): void {
    this.events.on(event, callback);
  }

  public off<K extends string>(
    event: K,
    callback: SDKEventCallback<K extends keyof SDKEventPayloadMap ? SDKEventPayloadMap[K] : any>
  ): void {
    this.events.off(event, callback);
  }

  public emit<K extends string>(
    event: K,
    payload: K extends keyof SDKEventPayloadMap ? SDKEventPayloadMap[K] : any
  ): void {
    this.events.emit(event, payload);
  }
}
