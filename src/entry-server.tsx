import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';

export interface RenderResult {
  html: string;
}

export function render(_url?: string): RenderResult {
  const html = renderToString(
    <StrictMode>
      <App />
    </StrictMode>
  );

  return { html };
}
