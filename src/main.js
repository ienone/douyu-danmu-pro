/**
 * =================================================================================
 * 斗鱼弹幕助手 - 主入口文件
 * ---------------------------------------------------------------------------------
 * 应用程序主入口，初始化各个模块和组件
 * =================================================================================
 */

import { Utils } from './utils/utils.js';
import { CONFIG } from './utils/CONFIG.js';
import { DanmukuDB } from './modules/DanmukuDB.js';
import { InputManager } from './modules/InputManager.js';
import { KeyboardController } from './modules/KeyboardController.js';
import { SettingsManager } from './modules/SettingsManager.js';

// 导入样式
import './styles/main.css';
import './styles/danmuku-popup.css';
import './styles/candidate-capsules.css';

/**
 * 应用程序主类
 */
class DouyuDanmukuAssistant {
    
    constructor() {
        this.initialized = false;
        this.modules = {};
    }
    
    /**
     * 初始化应用程序
     */
    async init() {
        try {
            Utils.log('初始化斗鱼弹幕助手...');
            
            // 等待DOM加载完成
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // 初始化数据库
            const dbSuccess = await DanmukuDB.init();
            if (!dbSuccess) {
                Utils.log('数据库初始化失败，某些功能可能无法正常工作', 'warn');
            }

            // 检查并执行首次数据导入
            await this.firstTimeImport();
            
            // 初始化键盘控制器
            KeyboardController.init();
            
            // 初始化输入管理器（会同时初始化UIManager）
            await InputManager.init();
            
            // 添加测试数据（开发阶段）
            // await this.addTestData();
            
            this.initialized = true;
            Utils.log('斗鱼弹幕助手初始化完成');
            
        } catch (error) {
            Utils.log(`初始化失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 检查并执行首次数据导入
     */
    async firstTimeImport() {
        try {
            const dataCount = await DanmukuDB.getDataCount();
            if (dataCount === 0) {
                Utils.log('数据库为空，开始首次数据导入...');
                // 调用 DanmukuDB 中的自动导入函数
                const result = await DanmukuDB.autoImportData();
                
                if (result && result.successCount > 0) {
                    Utils.log(`首次数据导入成功，共导入 ${result.successCount} 条弹幕。`);
                } else {
                    Utils.log('首次数据导入失败或没有导入任何数据。', 'warn');
                }
            } else {
                Utils.log(`数据库中已存在 ${dataCount} 条数据，跳过首次导入。`);
            }
        } catch (error) {
            Utils.log(`检查首次导入时发生错误: ${error.message}`, 'error');
        }
    }

    // /**
    //  * 添加测试数据（开发阶段使用）
    //  */
    // async addTestData() {
    //     try {
    //         // 确保数据库已初始化
    //         if (!DanmukuDB.initialized) {
    //             Utils.log('数据库未初始化，跳过添加测试数据', 'warn');
    //             return;
    //         }
            
    //         // 检查是否已有数据
    //         const existingData = await DanmukuDB.getAll();
    //         Utils.log(`当前数据库中有 ${existingData.length} 条记录`);
            
    //         if (existingData.length > 0) {
    //             Utils.log('数据库中已有数据，跳过添加测试数据');
    //             return; // 已有数据，不添加测试数据
    //         }
            
    //         // 自动导入3页API数据作为测试数据
    //         Utils.log('数据库为空，开始导入测试数据...');
    //         const importResult = await DanmukuDB.testAutoImport(3);
            
    //         if (importResult && importResult.successCount > 0) {
    //             Utils.log(`测试数据导入完成：成功 ${importResult.successCount} 条`);
    //         } else {
    //             // 如果API导入失败，添加本地测试数据作为备选
    //             const testTemplates = [
    //                 '666', '牛逼', '主播加油', '哈哈哈哈', '好看好看',
    //                 '主播真棒', '期待期待', '支持支持', '感谢分享', '学到了'
    //             ];
                
    //             let successCount = 0;
    //             for (const text of testTemplates) {
    //                 const result = await DanmukuDB.add(text, []);
    //                 if (result !== null) successCount++;
    //             }
                
    //             Utils.log(`备用测试数据添加完成：成功 ${successCount} 条`);
    //         }
            
    //     } catch (error) {
    //         Utils.log(`添加测试数据失败: ${error.message}`, 'error');
    //     }
    // }
    
    /**
     * 销毁应用程序
     */
    destroy() {
        if (!this.initialized) return;
        
        // 这里可以添加清理逻辑
        this.initialized = false;
        Utils.log('斗鱼弹幕助手已销毁');
    }
}

// --- Run Guard ---
if (window.douyuDanmakuAssistantLoaded) {
    Utils.log('检测到重复执行，已阻止。请检查是否安装了多个版本的插件。', 'warn');
} else {
    window.douyuDanmakuAssistantLoaded = true;

    // 创建应用程序实例
    const app = new DouyuDanmukuAssistant();

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            app.init();
        });
    } else {
        app.init();
    }

    // 页面卸载前清理
    window.addEventListener('beforeunload', () => {
        app.destroy();
    });

    // 导出应用实例（用于调试）
    window.DouyuDanmukuAssistant = app;
    window.DanmukuDB = DanmukuDB;
}