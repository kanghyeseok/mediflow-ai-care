import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/mediflow-ai-care/', // 👈 이 한 줄을 똑같이 추가해 주세요!
  plugins: [react()],
  // ... 혹시 아래에 다른 설정이 있다면 그대로 두시면 됩니다.
})