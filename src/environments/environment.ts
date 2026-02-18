/**
 * Local environment — used when running with the "local" configuration.
 * Points to locally running backend and identity services.
 *
 * Replaced at build time by:
 * - environment.development.ts  → configuration "development"
 * - environment.production.ts   → configuration "production"
 */
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7071',
  authority: 'https://identity.ibernia.it',
  authClientId: 'b2323429-bc5e-42f1-ac7c-9ece5dd49110',
};
