import { requireNativeView } from 'expo';
import * as React from 'react';

import { BookEngineViewProps } from './BookEngine.types';

const NativeView: React.ComponentType<BookEngineViewProps> = requireNativeView('BookEngine');

export default function BookEngineView(props: BookEngineViewProps) {
  return <NativeView {...props} />;
}
