/** Central translation key paths for client-facing copy (resolved via ngx-translate). */

// TODO: translate clientReport.welcomeModal.* to it before enabling it locale
export type Language = 'en' | 'it';

export function getTranslations(_lang: Language) {
  return {
    clientReport: {
      welcomeModal: {
        title: 'clientReport.welcomeModal.title',
        bodyPrimary: 'clientReport.welcomeModal.bodyPrimary',
        bodyDisclaimer: 'clientReport.welcomeModal.bodyDisclaimer',
        cta: 'clientReport.welcomeModal.cta',
      },
    },
  } as const;
}
