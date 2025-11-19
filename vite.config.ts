import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Загружаем env файлы. Используем process.cwd() безопасно.
  // В среде Node.js (где работает Vite) process всегда определен.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Прокидываем VITE_GEMINI_API_KEY в клиентский код через стандартный механизм Vite
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
    }
  }
})