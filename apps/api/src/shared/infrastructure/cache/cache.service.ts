export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  clear(): Promise<void>;
  getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds?: number,
  ): Promise<T>;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

export class InMemoryCacheService implements ICacheService {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(cleanupIntervalMs: number = 60000) {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, cleanupIntervalMs);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!pattern.includes("*") && !pattern.includes("?")) {
      this.cache.delete(pattern);
      return;
    }
    const firstWildcard = Math.min(
      pattern.indexOf("*") >= 0 ? pattern.indexOf("*") : Infinity,
      pattern.indexOf("?") >= 0 ? pattern.indexOf("?") : Infinity,
    );
    const prefix = pattern.substring(0, firstWildcard);
    const escaped = pattern
      .split(/(\*|\?)/)
      .map((part) => {
        if (part === "*") return "[^:]*";
        if (part === "?") return ".";
        return part.replace(/[.*+^${}()|[\]\\]/g, "\\$&");
      })
      .join("");
    const regex = new RegExp("^" + escaped + "$");
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix) && regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Cache key generators for the athletic shoes e-commerce domain
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userByEmail: (email: string) => `user:email:${email}`,
  product: (productId: string) => `product:${productId}`,
  productBySlug: (slug: string) => `product:slug:${slug}`,
  productVariant: (variantId: string) => `product-variant:${variantId}`,
  productsByCategory: (categoryId: string) => `category:${categoryId}:products`,
  category: (categoryId: string) => `category:${categoryId}`,
  categories: () => `categories:all`,
  cart: (cartId: string) => `cart:${cartId}`,
  cartByUser: (userId: string) => `cart:user:${userId}`,
  order: (orderId: string) => `order:${orderId}`,
  inventory: (variantId: string) => `inventory:${variantId}`,
  sizeGuide: (categoryId: string) => `size-guide:${categoryId}`,
};
