'use client';

import React from 'react';

/**
 * @fileOverview ZoneGuard - Now transparent to allow instant app access.
 * Strict blocking logic removed as per user request to use the manual selection system.
 */
export function ZoneGuard({ children }: { children: React.ReactNode }) {
  // Simply return children to avoid blocking the app on launch
  return <>{children}</>;
}
