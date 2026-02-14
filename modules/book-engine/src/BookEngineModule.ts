import { NativeModule, requireNativeModule } from 'expo';

import { BookEngineModuleEvents } from './BookEngine.types';

declare class BookEngineModule extends NativeModule<BookEngineModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
  getChapterBody(filePath: string): string;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<BookEngineModule>('BookEngine');
