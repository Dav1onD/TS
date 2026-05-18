import { useRef } from 'react';
import { Provider } from 'react-redux';
import { localDocumentApi } from './spreadsheet/mockApi';
import type { DocumentApi } from './spreadsheet/types';
import { AppRouter } from './router';
import { createAppStore } from './store';

type AppProps = {
  api?: DocumentApi;
  initialEntries?: string[];
};

export default function App({ api = localDocumentApi, initialEntries }: AppProps) {
  const storeRef = useRef(createAppStore(api));

  return (
    <Provider store={storeRef.current}>
      <AppRouter initialEntries={initialEntries} />
    </Provider>
  );
}
