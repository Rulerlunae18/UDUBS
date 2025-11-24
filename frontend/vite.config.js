export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      host: "udubs-frontend.onrender.com",
    },
  },
  preview: {
    allowedHosts: [
      "udubs-frontend.onrender.com"
    ]
  }
})
