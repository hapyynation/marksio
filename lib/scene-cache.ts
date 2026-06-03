// Shared server-side cache for scene background image URLs
// Persists across requests until server restart
export const sceneBgCache = new Map<string, string>()
