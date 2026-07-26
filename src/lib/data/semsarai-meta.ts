/** Métadonnées d'import catalogue portails — fichier léger (sans les 5000 annonces). */
export const SEMSARAI_IMPORT_META = {
  source: "portails (Mubawab, Avito…)",
  sourceUrl: "https://www.mubawab.ma",
  apiUrl: "https://server-production-a8d0.up.railway.app",
  importedAt: "2026-07-25T15:51:12.463Z",
  count: 5000,
  apiTotalCount: 72971,
  photosDownloaded: false,
  totalPhotos: 29339,
  isAggregated: true,
} as const;

export const SEMSARAI_API_TOTAL = SEMSARAI_IMPORT_META.apiTotalCount;
