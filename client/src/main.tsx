import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-ignore
import './index.css'
import App from './App.tsx'
import {ComputeEngine} from "@cortex-js/compute-engine";
import './i18n';
import {MathfieldElement} from "mathlive";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

MathfieldElement.fontsDirectory = '/fonts/mathlive';
export const ce = new ComputeEngine();
(window as any).ce = ce;
