import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { imagetools } from 'vite-imagetools'

function autoWebpPlugin() {
  return {
    name: 'auto-webp',
    enforce: 'pre',
    transform(code, id) {
      if (!id.match(/\.(jsx?|tsx?)$/)) {
        return null
      }

      const imageImportRegex = /from\s+['"`]([^'"`]+\.(png|jpg|jpeg))['"`]/gi
      let modifiedCode = code
      let hasChanges = false

      modifiedCode = modifiedCode.replace(imageImportRegex, (match, imagePath) => {
        if (imagePath.includes('?')) {
          return match
        }
        hasChanges = true
        return match.replace(imagePath, `${imagePath}?format=webp&quality=100`)
      })

      const requireRegex = /require\(['"`]([^'"`]+\.(png|jpg|jpeg))['"`]\)/gi
      modifiedCode = modifiedCode.replace(requireRegex, (match, imagePath) => {
        if (imagePath.includes('?')) {
          return match
        }
        hasChanges = true
        return match.replace(imagePath, `${imagePath}?format=webp&quality=100`)
      })

      return hasChanges ? { code: modifiedCode, map: null } : null
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    autoWebpPlugin(),
    imagetools({
      defaultDirectives: (url) => {
        const params = new URLSearchParams(url.searchParams)
        if (!params.has('format')) {
          params.set('format', 'webp')
        }
        if (!params.has('quality')) {
          params.set('quality', '100')
        }
        return params
      },
    }),
  ],
})
