import AppProviders from '@/components/sidepanel/app-providers'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
)