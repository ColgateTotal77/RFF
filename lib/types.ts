export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface Chapter {
  id: string;
  href: string;
  fullPath: string;
  label?: string;
}

export interface Book {
  title: string;
  cover?: string;
  chapters: Chapter[];
  basePath: string;
  currentChapters: number[];
  lastScrollPosition: number;
  settings: BookSettings;
}

export interface Font {
  fontSize: number;
  fontFamily: string;
}

export interface BookSettings {
  ankiDeckId?: string;
  ankiModelId?: string;
  font?: Font;
}

export interface DefaultBookSettings {
  ankiDeckId?: string;
  ankiModelId?: string;
  font: Font;
}

export interface Setting {
  defaultBookSettings: DefaultBookSettings;
}
