interface Response {
  lemma: string;
  definition: string;
}

export const getWiktionaryData = async (word: string, langCode: string): Promise<Response> => {
  try {
    const url = `https://${langCode}.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`;
    const res = await fetch(url);
    if (!res.ok) return { lemma: word, definition: '' };

    const data = await res.json();
    if (!data[langCode] || data[langCode].length === 0) return { lemma: word, definition: '' };

    const rawHtml = data[langCode][0].definitions[0].definition;

    if (rawHtml.includes('class="form-of-definition')) {
      const lemmaMatch = rawHtml.match(/<a rel="mw:WikiLink" href="[^"]+" title="([^"]+)">/g);
      if (lemmaMatch && lemmaMatch.length > 0) {
        const lastTag = lemmaMatch[lemmaMatch.length - 1];
        const baseWord = lastTag.match(/title="([^"]+)"/)?.[1] || word;
        const lemmaData = await getWiktionaryData(baseWord, langCode);
        return { lemma: baseWord.toLowerCase(), definition: lemmaData.definition };
      }
    }

    const cleanDefinition = rawHtml
      .replace(/<[^>]*>?/gm, '')
      .replace(/\.[a-z-]+\{[^}]*\}/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    return { lemma: word.toLowerCase(), definition: cleanDefinition };
  } catch (e) {
    console.error('Wiktionary fetch failed:', e);
    return { lemma: word.toLowerCase(), definition: '' };
  }
};
