
/**
 * @fileOverview Legacy route neutralized to prevent Dynamic Route Conflict with [slug].
 * All page logic has been moved to /src/app/page/[slug]/page.tsx.
 * This file is kept to avoid breaking the build if the folder cannot be deleted.
 */
export default function LegacyPagesRoute() {
  return null;
}
