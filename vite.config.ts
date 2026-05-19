import { defineConfig } from 'vite'

const 기본경로 = process.env.VITE_BASE_PATH ?? '/'

export default defineConfig({
  base: 기본경로,
})
