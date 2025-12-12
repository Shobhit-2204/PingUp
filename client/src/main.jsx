import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { Provider } from 'react-redux'
import { store } from './app/store.js'
import { dark } from '@clerk/themes'


const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

createRoot(document.getElementById('root')).render(
  <ClerkProvider 
    publishableKey={PUBLISHABLE_KEY}
    appearance={{
      baseTheme: dark,
      variables: {
        colorPrimary: '#6366f1',
        colorBackground: '#0f172a',
        colorInputBackground: '#1e293b',
        colorInputText: '#f1f5f9',
        colorText: '#e2e8f0',
        colorTextSecondary: '#cbd5e1',
        colorBorder: '#334155',
        colorDanger: '#ef4444'
      }
    }}
  >
      
    <BrowserRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </BrowserRouter>
  </ClerkProvider>
)
 