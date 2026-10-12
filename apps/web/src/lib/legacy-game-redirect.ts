import vercelConfig from '../../vercel.json';

// Use the same destinations as Vercel. This runs directly from the exported
// HTML, so a legacy page can redirect even if its JS/CSS requests fail.
export const legacyGameRedirectScript = `(() => {
  const rules = ${JSON.stringify(vercelConfig.redirects).replaceAll('<', '\\u003c')};
  const rule = rules.find((entry) =>
    entry.source === '/:path*' && entry.has.some((condition) =>
      condition.type === 'host' && condition.value === window.location.hostname
    )
  );
  if (!rule) return;
  const target = new URL(rule.destination.replace('/:path*', '/'));
  target.pathname = window.location.pathname;
  target.search = window.location.search;
  target.hash = window.location.hash;
  if (target.href !== window.location.href) window.location.replace(target.href);
})();`;
