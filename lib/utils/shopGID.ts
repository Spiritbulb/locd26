// utils/shopify.ts

/**
 * Extracts the numeric ID from a Shopify Global ID (GID)
 * @param gid - Shopify GID (e.g., "gid://shopify/Product/10050000224388")
 * @returns The numeric ID as a string
 */
export function extractIdFromGid(gid: string): string {
  return gid.split('/').pop() || '';
}

/**
 * Creates a Shopify GID from a numeric ID
 * @param id - Numeric ID
 * @param resource - Resource type (e.g., "Product", "Variant")
 * @returns Shopify GID
 */
export function createGid(id: string, resource: string = 'Product'): string {
  return `gid://shopify/${resource}/${id}`;
}

/**
 * Converts a product GID to a URL-friendly slug
 * You might want to combine this with the product handle for better SEO
 * @param gid - Product GID
 * @returns URL slug
 */
export function gidToSlug(gid: string): string {
  return extractIdFromGid(gid);
}

/**
 * Creates a product URL from handle (preferred) or GID fallback
 * @param handle - Product handle (preferred)
 * @param gid - Product GID (fallback)
 * @returns Product URL path
 */
export function createProductUrl(handle?: string, gid?: string): string {
  if (handle) {
    return `/products/${handle}`;
  }
  if (gid) {
    return `/products/${extractIdFromGid(gid)}`;
  }
  return '/products';
}