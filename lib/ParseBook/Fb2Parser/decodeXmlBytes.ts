const CP1251_HIGH =
  'ЂЃ‚ѓ„…†‡€‰Љ‹ЊЌЋЏђ‘’“”•–—™љ›њќћџ ЎўЈ¤Ґ¦§Ё©Є«¬­®Ї°±Ііґµ¶·ё№є»јЅѕїАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя';

export const detectXmlEncoding = (bytes: Uint8Array): string => {
  const prolog = new TextDecoder('utf-8').decode(bytes.subarray(0, 200));
  return /encoding=["']([^"']+)["']/i.exec(prolog)?.[1]?.toLowerCase() ?? 'utf-8';
};

export const decodeCp1251 = (bytes: Uint8Array): string => {
  const len = bytes.length;
  const codeUnits = new Uint16Array(len);
  for (let i = 0; i < len; i++) {
    const b = bytes[i];
    codeUnits[i] = b < 0x80 ? b : CP1251_HIGH.charCodeAt(b - 0x80);
  }

  let out = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < len; i += CHUNK) {
    out += String.fromCharCode(...codeUnits.subarray(i, i + CHUNK));
  }
  return out;
};

// TODO: other legacy encodings (koi8-r/u, windows-1250/1252, iso-8859-x) still
// fall through to UTF-8 and will produce mojibake. Add table-based decoders like
// CP1251_HIGH as they show up in real files — or, better, move decoding into the
// native module where java.nio.charset handles every charset for free.
