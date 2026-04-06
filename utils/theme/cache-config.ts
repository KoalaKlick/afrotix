interface TenantConfig {
  [key: string]: unknown;
}

export const CACHE_KEY = "tenant-config-cache";
export const CACHE_DOMAIN_KEY = "tenant-config-cache-domain";
export const CACHE_DURATION = 3600000; // 1 hour in milliseconds

interface CachedConfig {
  config: TenantConfig;
  timestamp: number;
}

/**
 * Get cached tenant config from localStorage
 * @returns Cached config if exists and not expired, null otherwise
 */
export function getCachedConfig(): TenantConfig | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cachedData: CachedConfig = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - cachedData.timestamp > CACHE_DURATION) {
      clearCache();
      return null;
    }

    return cachedData.config;
  } catch (err) {
    console.error("Error reading cached config:", err);
    return null;
  }
}

/**
 * Get the cached domain from localStorage
 * @returns Cached domain string or null
 */
export function getCachedDomain(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(CACHE_DOMAIN_KEY);
  } catch (err) {
    console.error("Error reading cached domain:", err);
    return null;
  }
}

/**
 * Cache tenant config in localStorage
 * @param config - TenantConfig to cache
 * @param domain - Domain associated with this config
 */
export function setCachedConfig(config: TenantConfig, domain: string): void {
  if (typeof window === "undefined") return;

  try {
    const cachedData: CachedConfig = {
      config,
      timestamp: Date.now(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));
    localStorage.setItem(CACHE_DOMAIN_KEY, domain);
  } catch (err) {
    console.error("Error caching config:", err);
  }
}

/**
 * Clear cached tenant config from localStorage
 */
export function clearCache(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_DOMAIN_KEY);
  } catch (err) {
    console.error("Error clearing cache:", err);
  }
}

