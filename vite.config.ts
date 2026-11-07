import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base so the same build works at a domain root, on a project page
// (username.github.io/repo/) or from any subfolder. The app is hash-routed,
// so nothing depends on the document path.
export default defineConfig({
  base: './',
  plugins: [react()],
})
