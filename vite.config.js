import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
    plugins: [
        monkey({
            entry: 'src/main.js',
            userscript: {
                name: '斗鱼弹幕助手',
                namespace: 'http://tampermonkey.net/',
                description: '为斗鱼发送弹幕提供便利畅快的输入体验与补全功能',
                version: '1.0.0',
                author: 'ienone',
                match: [
                    '*://www.douyu.com/*',
                ],
                connect: [
                    'api.example.com',  // TODO: 替换为实际的后端API域名
                    'localhost:*'       // 开发环境
                ],
                'run-at': 'document-start',
                license: 'MIT',
                icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMxOTc2RDIiLz4KPHN2ZyB4PSIxNiIgeT0iMTYiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjxwYXRoIGQ9Im0xMiAxNSA0LTggNCA4Ii8+CjxwYXRoIGQ9Im0xNy0yIDMgM0wxN3oiLz4KPHN2Zz4KPHN2Zz4K',
                grant: [
                    'GM_addStyle',
                    'GM_getValue',
                    'GM_setValue',
                    'GM_deleteValue',
                    'GM_listValues',
                    'GM_xmlhttpRequest',
                    'GM_notification'
                ],
            },
            build: {
                fileName: '斗鱼弹幕助手.user.js',
                sourcemap: 'inline',
                minify: false,  // 开发阶段保持代码可读性
            },
            server: {
                mountGmApi: true,
                open: false,  // 不自动打开浏览器
            }
        }),
    ],
    
    // 构建优化配置
    build: {
        target: 'es2015',  // 兼容更多浏览器
        rollupOptions: {
            output: {
                // 确保 CSS 被正确内联
                assetFileNames: '[name].[ext]'
            }
        }
    },
    
    // CSS 处理配置
    css: {
        modules: false,  // 不使用 CSS modules
        preprocessorOptions: {
            css: {
                charset: false  // 避免编码问题
            }
        }
    },
    
    // 解析配置
    resolve: {
        alias: {
            '@': '/src',  // 可选：设置路径别名
        }
    }
});
