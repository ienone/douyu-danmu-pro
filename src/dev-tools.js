/**
 * =================================================================================
 * 斗鱼弹幕助手 - 开发工具集成
 * ---------------------------------------------------------------------------------
 * 将测试功能无缝集成到插件中，通过控制台调用
 * =================================================================================
 */

import { DanmukuDB } from './modules/DanmukuDB.js';
import { Utils } from './utils/utils.js';

/**
 * 开发工具管理器
 */
export const DevTools = {
    /**
     * 初始化开发工具
     */
    async init() {
        if (typeof window === 'undefined') return;
        
        // 等待数据库初始化完成
        if (!DanmukuDB.initialized) {
            await DanmukuDB.init();
        }
        
        // 挂载到全局对象
        this.attachToWindow();
        
        // 添加键盘快捷键
        this.addKeyboardShortcuts();
        
        // 输出使用说明
        this.showUsageInstructions();
    },
    
    /**
     * 挂载工具到全局对象
     */
    attachToWindow() {
        window.DanmukuDev = {
            // === 数据导入测试 ===
            import: async (pages = 3) => {
                console.log(`🚀 开始导入 ${pages} 页数据...`);
                return await DanmukuDB.testAutoImport(pages);
            },
            
            // === 数据查看 ===
            stats: async () => {
                const stats = await DanmukuDB.getStatistics();
                console.table(stats);
                return stats;
            },
            
            count: async () => {
                const count = await DanmukuDB.getDataCount();
                console.log(`📊 数据库总数量: ${count}`);
                return count;
            },
            
            logs: async (limit = 5) => {
                const logs = await DanmukuDB.getImportLogs(limit);
                console.table(logs);
                return logs;
            },
            
            // === 搜索测试 ===
            search: async (query = '6', sortBy = 'relevance', limit = 10) => {
                const results = await DanmukuDB.search(query, limit, sortBy);
                console.log(`🔍 搜索 "${query}" (${sortBy}): ${results.length} 条结果`);
                console.table(results.map(r => ({ text: r.text, popularity: r.popularity, useCount: r.useCount })));
                return results;
            },
            
            // === 数据管理 ===
            clear: async () => {
                const confirmed = confirm('⚠️ 确定要清空所有数据吗？此操作不可恢复！');
                if (confirmed) {
                    const result = await DanmukuDB.clear();
                    console.log(result ? '✅ 数据库已清空' : '❌ 清空失败');
                    return result;
                }
                return false;
            },
            
            // === 快捷方法 ===
            quick: {
                import1: () => window.DanmukuDev.import(1),
                import3: () => window.DanmukuDev.import(3),
                import5: () => window.DanmukuDev.import(5),
                import10: () => window.DanmukuDev.import(10),
                popularSearch: (query) => window.DanmukuDev.search(query, 'popularity'),
                recentSearch: (query) => window.DanmukuDev.search(query, 'recent')
            },
            
            // === 直接访问 ===
            db: DanmukuDB,
            utils: Utils
        };
    },
    
    /**
     * 添加键盘快捷键
     */
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl+Shift+I: 快速导入
            if (event.ctrlKey && event.shiftKey && event.key === 'I') {
                event.preventDefault();
                window.DanmukuDev.quick.import3();
            }
            
            // Ctrl+Shift+S: 统计信息
            if (event.ctrlKey && event.shiftKey && event.key === 'S') {
                event.preventDefault();
                window.DanmukuDev.stats();
            }
        });
    },
    
    /**
     * 显示使用说明
     */
    showUsageInstructions() {
        console.log('%c=== 斗鱼弹幕助手开发工具 ===', 'color: #00ff00; font-size: 16px; font-weight: bold;');
        console.log('%c📦 数据导入:', 'color: #0099ff; font-weight: bold;');
        console.log('  DanmukuDev.import(3)     - 导入3页数据');
        console.log('  DanmukuDev.quick.import5() - 快速导入5页');
        
        console.log('%c📊 数据查看:', 'color: #ff9900; font-weight: bold;');
        console.log('  DanmukuDev.stats()       - 查看统计信息');
        console.log('  DanmukuDev.count()       - 查看数据总量');
        console.log('  DanmukuDev.logs()        - 查看导入日志');
        
        console.log('%c🔍 搜索测试:', 'color: #9900ff; font-weight: bold;');
        console.log('  DanmukuDev.search("关键词") - 搜索测试');
        console.log('  DanmukuDev.quick.popularSearch("6") - 按人气搜索');
        
        console.log('%c🗑️ 数据管理:', 'color: #ff3300; font-weight: bold;');
        console.log('  DanmukuDev.clear()       - 清空数据库');
        
        console.log('%c⌨️ 快捷键:', 'color: #00ff99; font-weight: bold;');
        console.log('  Ctrl+Shift+I - 快速导入3页');
        console.log('  Ctrl+Shift+S - 查看统计');
    }
};

// 自动初始化（在开发环境中）
if (typeof window !== 'undefined') {
    // 检测开发环境
    const isDev = location.hostname === 'localhost' || 
                  location.hostname === '127.0.0.1' ||
                  location.search.includes('dev=1') ||
                  localStorage.getItem('danmuku_dev_mode') === 'true';
    
    if (isDev) {
        // 延迟初始化，确保其他模块已加载
        setTimeout(() => {
            DevTools.init();
        }, 1000);
    }
}