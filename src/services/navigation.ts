export type NavPage = 'dashboard' | 'predict' | 'scenarios';
export interface AppRoute { page: NavPage; modelInfo: boolean; legacyInsights: boolean }

// Keep old hash and path bookmarks working without adding a fourth page.
export function resolveRoute(hash: string, pathname = '/'): AppRoute {
  const value = hash.replace(/^#/, '');
  if (value === 'insights' || value === '/insights' || (!value && /^\/insights\/?$/.test(pathname))) {
    return { page: 'predict', modelInfo: true, legacyInsights: true };
  }
  if (value === 'predict/model-info') return { page: 'predict', modelInfo: true, legacyInsights: false };
  const page = value === 'predict' || value === 'scenarios' ? value : 'dashboard';
  return { page, modelInfo: false, legacyInsights: false };
}
