import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/w2',
  plugins: [
    react(),
    VitePWA({
  injectRegister: 'script',
      selfDestroying: !!(process.env.TAURI || process.env.CAPACITOR || process.env.BUILD_TARGET === 'native' || process.env.VITE_ENABLE_PWA === 'false'),
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png', 'app-icon.png'],
      manifest: undefined, // 使用 public/manifest.webmanifest
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            // 明确排除 API 代理请求
            urlPattern: /^\/api\//,
            handler: 'NetworkOnly'
          },
          {
            // 同源静态资源：CSS/JS/图片
            urlPattern: ({ request, sameOrigin }) => sameOrigin && ['style', 'script', 'image'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources'
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],

  // 开发服务器配置
  server: {
    port: 5173,
    host: process.env.TAURI_DEV_HOST || '0.0.0.0', // 使用 Tauri 提供的主机地址
    cors: false, // 完全禁用 CORS 检查
    strictPort: true, // 严格端口模式
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
    },
    // 配置 HMR WebSocket 以支持 Tauri 移动端
    hmr: process.env.TAURI_DEV_HOST ? {
      protocol: 'ws',
      host: process.env.TAURI_DEV_HOST,
      port: 5174,
    } : {
      port: 5174,
      host: '0.0.0.0'
    },
    proxy: {
      // Exa API代理
      '/api/exa': {
        target: 'https://api.exa.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/exa/, ''),
        headers: {
          'Origin': 'https://api.exa.ai'
        }
      },
      // Bocha API代理
      '/api/bocha': {
        target: 'https://api.bochaai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bocha/, ''),
        headers: {
          'Origin': 'https://api.bochaai.com'
        }
      },
      // Firecrawl API代理
      '/api/firecrawl': {
        target: 'https://api.firecrawl.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/firecrawl/, ''),
        headers: {
          'Origin': 'https://api.firecrawl.dev'
        }
      },
      // MCP SSE 代理 - glama.ai
      '/api/mcp-glama': {
        target: 'https://glama.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mcp-glama/, ''),
        headers: {
          'Origin': 'https://glama.ai',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      },
      // MCP SSE 代理 - modelscope
      '/api/mcp-modelscope': {
        target: 'https://mcp.api-inference.modelscope.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mcp-modelscope/, ''),
        headers: {
          'Origin': 'https://mcp.api-inference.modelscope.net',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      },
      // MCP HTTP Stream 代理 - router.mcp.so
      '/api/mcp-router': {
        target: 'https://router.mcp.so',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mcp-router/, ''),
        headers: {
          'Origin': 'https://router.mcp.so',
          'Accept': 'application/json, text/event-stream',
          'Cache-Control': 'no-cache'
        }
      },
      // Notion API代理
      '/api/notion': {
        target: 'https://api.notion.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/notion/, ''),
        headers: {
          'Origin': 'https://api.notion.com'
        }
      },
      // WebDAV 代理 - 支持坚果云等 WebDAV 服务
      '/api/webdav': {
        target: 'https://dav.jianguoyun.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/webdav/, '/dav'),
        headers: {
          'Origin': 'https://dav.jianguoyun.com'
        }
      },
      // DuckDuckGo 搜索代理 - 用于 WebScout MCP 服务器
      '/api/duckduckgo': {
        target: 'https://html.duckduckgo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/duckduckgo/, ''),
        headers: {
          'Origin': 'https://html.duckduckgo.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      },

    }
  },

  // 构建配置
  build: {
    sourcemap: false,
    target: 'es2022',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    chunkSizeWarningLimit: 1000
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/system',
      '@mui/utils',
      '@reduxjs/toolkit'
    ],
    force: true
  },

  // 缓存配置
  cacheDir: 'node_modules/.vite',

  // 解析配置
  resolve: {
    alias: {
      '@': '/src'
    }
  },

  // 定义全局常量
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production'),
  },
})
