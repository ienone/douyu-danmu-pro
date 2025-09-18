import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
    plugins: [
        monkey({
            entry: 'src/main.js',
            userscript: {
                name: '斗鱼弹幕助手',
                namespace: 'http://tampermonkey.net/',
                description: '为斗鱼(6657)发送弹幕提供便利畅快的输入体验与补全功能',
                version: '1.0.0',
                author: 'ienone',
                match: [
                    '*://www.douyu.com/*',
                ],
                connect: [
                    'data.ienone.top',  // 弹幕数据源域名
                    'localhost:*'       // 开发环境
                ],
                'run-at': 'document-start',
                license: 'MIT',
                noframes: true,
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
                fileName: 'danmupro.user.js',
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
