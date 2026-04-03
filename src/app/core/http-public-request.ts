/** API paths that must not attach auth or treat 401 as “session expired” (shared flows). */
export function isPublicNoAuthRequest(url: string): boolean {
  const u = url || '';
  return (
    u.includes('/Questionnaire/view/') ||
    u.includes('/Questionnaire/submit/') ||
    u.includes('/ClientReport/view/')
  );
}
