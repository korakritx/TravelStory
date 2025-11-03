import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // 👈 สำคัญ! เพื่อให้ router ทำงานตอน deploy
})
