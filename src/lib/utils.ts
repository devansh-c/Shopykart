import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates an SEO friendly slug from a string.
 * High performance regex to ensure clean URLs.
 */
export function slugify(text: string) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start
    .replace(/-+$/, '');      // Trim - from end
}

/**
 * Legacy Support: Extracts ID if present (kept for internal logic if needed)
 */
export function extractIdFromSlug(slug: string) {
  if (!slug) return '';
  const parts = slug.split('-');
  return parts[parts.length - 1];
}
