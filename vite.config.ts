import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'template-api',
      configureServer(server) {
        server.middlewares.use('/api/save-template', (req, res, next) => {
          if (req.method === 'POST') {
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            
            req.on('end', () => {
              try {
                const { filename, content, size } = JSON.parse(body)
                
                // Create templates directory if it doesn't exist
                const templatesDir = path.join(process.cwd(), 'public', 'templates', size)
                if (!fs.existsSync(templatesDir)) {
                  fs.mkdirSync(templatesDir, { recursive: true })
                }
                
                // Save the template file
                const filePath = path.join(templatesDir, filename)
                fs.writeFileSync(filePath, content, 'utf8')
                
                console.log(`Template saved to: ${filePath}`)
                
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ success: true, message: 'Template saved successfully' }))
              } catch (error) {
                console.error('Error saving template:', error)
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ success: false, message: 'Failed to save template' }))
              }
            })
          } else {
            next()
          }
        })
      }
    }
  ],
  server: {
    port: 3001,
    fs: {
      allow: ['..']
    }
  }
})
