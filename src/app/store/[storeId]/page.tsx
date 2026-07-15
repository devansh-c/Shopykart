
/**
 * @fileOverview Legacy route neutralized to prevent Dynamic Route Conflict with [slug].
 * All store logic has been moved to /src/app/store/[slug]/page.tsx.
 * This file is kept to avoid breaking the build if the folder cannot be deleted.
 */
export default function LegacyStorePage() {
  return null;
}
