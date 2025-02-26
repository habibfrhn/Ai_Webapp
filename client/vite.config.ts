import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',           // existing page
        invoiceUploader: 'invoice-uploader.html', // new page
      },
    },
  },
})
