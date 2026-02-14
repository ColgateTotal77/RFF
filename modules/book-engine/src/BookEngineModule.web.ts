import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './BookEngine.types';

type BookEngineModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

class BookEngineModule extends NativeModule<BookEngineModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(BookEngineModule, 'BookEngineModule');
