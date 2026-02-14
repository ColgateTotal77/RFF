import { requireNativeModule } from 'expo-modules-core';

const BookEngine = requireNativeModule('BookEngine');
const Anki = requireNativeModule('Anki');

export { Anki, BookEngine };
