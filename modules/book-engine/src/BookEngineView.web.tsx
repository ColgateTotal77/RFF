import * as React from 'react';

import { BookEngineViewProps } from './BookEngine.types';

export default function BookEngineView(props: BookEngineViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
