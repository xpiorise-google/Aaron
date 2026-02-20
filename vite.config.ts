import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isDev = mode === 'development';
    
    return {
      // 指定入口文件为 TheCoo.html
      build: {
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'TheCoo.html'),
          },
        },
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
        // 开发模式下指定入口文件
        open: '/TheCoo.html',
        // 配置代理：将 /v1/chat/completions 代理到 AI 基座
        proxy: {
          '/v1/chat/completions': {
            target: 'https://xertest.wenshidt.com:8999',
            changeOrigin: true,
            secure: false, // 如果使用自签名证书，设置为 false
            configure: (proxy, options) => {
              proxy.on('proxyReq', (proxyReq, req, res) => {
                // 从环境变量读取 API Key，如果没有则使用默认值
                const apiKey = env.VITE_AI_API_KEY || 'xer-7tmbvp94snka4p45sexgdh6wta8z1cmb';
                proxyReq.setHeader('Authorization', apiKey);
              });
            },
          },
        },
      },
      base: isDev ? '/' : './', // 生产环境使用相对路径
      plugins: [
        react(),
        // 自定义插件：在开发模式下将 TheCoo.html 作为入口
        {
          name: 'thecoo-html-entry',
          configureServer(server) {
            server.middlewares.use((req, res, next) => {
              if (req.url === '/' || req.url === '/index.html') {
                req.url = '/TheCoo.html';
              }
              next();
            });
          },
        },
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // AI 基座配置（通过 import.meta.env 访问，无需 define）
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
