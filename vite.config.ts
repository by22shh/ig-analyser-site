import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Inject OpenRouter Key (support both VITE_ prefixed and standard naming)
      'process.env.OPENROUTER_API_KEY': JSON.stringify(
        env.OPENROUTER_API_KEY || 
        env.VITE_OPENROUTER_API_KEY || 
        process.env.OPENROUTER_API_KEY || 
        ''
      ),
      // Inject Apify Token
      'process.env.VITE_APIFY_TOKEN': JSON.stringify(
        env.VITE_APIFY_TOKEN || 
        process.env.VITE_APIFY_TOKEN || 
        ''
      ),
    }
  }
})