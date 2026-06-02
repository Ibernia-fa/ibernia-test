import { ALLOWED_ENVS } from './config.js';

export function assertEnvironment(env, allowNonDev) {
  if (env === 'prod' || env === 'production') {
    throw new Error('Refusing --env prod/production. User pool is non-production only.');
  }
  if (!ALLOWED_ENVS.has(env)) {
    throw new Error(`Invalid --env "${env}". Allowed: ${[...ALLOWED_ENVS].join(', ')}`);
  }
}

export function assertNonProdUrl(url, label, allowNonDev) {
  if (allowNonDev) return;
  const l = String(url || '').toLowerCase();
  const ok =
    l.includes('dev-identity.ibernia.it') ||
    l.includes('dev-api.ibernia.it') ||
    l.includes('localhost') ||
    l.includes('127.0.0.1') ||
    l.includes('-qa.') ||
    l.includes('-staging.') ||
    l.includes('staging-');
  if (!ok) {
    throw new Error(
      `Refusing ${label}="${url}". Use dev/qa/staging hosts or pass --allow-non-dev intentionally.`,
    );
  }
}
