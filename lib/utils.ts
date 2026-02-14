import { XMLParser } from 'fast-xml-parser';

export const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

export const ensureArray = (item: any) => {
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
};

export const extractBodyContent = (html: string) => {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : html;
};

export const deepMerge = (target: any, source: any): any => {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
};
