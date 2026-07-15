import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates an SEO friendly slug from a string.
 */
export function slugify(text: string) {
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
 * Extracts the real Firestore ID from an SEO slug.
 * Assumes format: name-slug-here-ID
 */
export function extractIdFromSlug(slug: string) {
  if (!slug) return '';
  const parts = slug.split('-');
  return parts[parts.length - 1];
}
