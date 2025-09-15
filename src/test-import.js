/**
 * =================================================================================
 * 斗鱼弹幕助手 - 数据导入测试脚本
 * ---------------------------------------------------------------------------------
 * 用于测试自动导入功能的独立脚本
 * =================================================================================
 */

import { DanmukuDB } from './modules/DanmukuDB.js';
import { Utils } from './utils/utils.js';

/**
 * 测试数据导入功能
 * @param {number} pages - 要导入的页数
 */
async function testDataImport(pages = 3) {
    try {
        Utils.log('=== 弹幕数据导入测试开始 ===');
        Utils.log(`数据来源: https://hguofichp.cn:10086/machine/sortAllBarrage (按人气排序)`);
        Utils.log(`备用数据源: https://hguofichp.cn:10086/machine/Page (时间排序)`);
        Utils.log(`标签字典: https://hguofichp.cn:10086/machine/dictList`);
        
        // 1. 初始化数据库
        Utils.log('1. 初始化数据库...');
        const initResult = await DanmukuDB.init();
        if (!initResult) {
            throw new Error('数据库初始化失败');
        }
        
        // 2. 获取导入前的数据统计
        Utils.log('2. 获取导入前数据统计...');
        const beforeStats = await DanmukuDB.getStatistics();
        
        // 3. 执行测试导入 (使用API数据)
        Utils.log(`3. 开始从API导入 ${pages} 页数据...`);
        Utils.log(`   - 每页 50 条弹幕`);
        Utils.log(`   - 按人气排序获取最热门弹幕`);
        Utils.log(`   - 自动获取并解析标签`);
        const importResult = await DanmukuDB.testAutoImport(pages);
        
        // 4. 获取导入后的数据统计
        Utils.log('4. 获取导入后数据统计...');
        const afterStats = await DanmukuDB.getStatistics();
        
        // 5. 测试搜索功能
        Utils.log('5. 测试搜索功能...');
        await testSearchFunctionality();
        
        // 6. 显示完整报告
        Utils.log('=== API数据导入测试完整报告 ===');
        Utils.log(`API请求页数: ${pages}`);
        Utils.log(`导入状态: ${importResult.status}`);
        Utils.log(`API返回总数: ${importResult.totalProcessed} 条`);
        Utils.log(`成功导入: ${importResult.successCount} 条`);
        Utils.log(`重复跳过: ${importResult.duplicateCount} 条`);
        Utils.log(`失败: ${importResult.failCount} 条`);
        Utils.log(`耗时: ${(importResult.duration / 1000).toFixed(2)} 秒`);
        Utils.log(`导入前总数: ${beforeStats.total}`);
        Utils.log(`导入后总数: ${afterStats.total}`);
        Utils.log(`净增加: ${afterStats.total - beforeStats.total} 条`);
        
        // 7. 获取导入日志
        const logs = await DanmukuDB.getImportLogs(3);
        Utils.log(`最近导入记录: ${logs.length} 条`);
        
        return importResult;
        
    } catch (error) {
        Utils.log(`API数据导入测试出错: ${error.message}`, 'error');
        return null;
    }
}

/**
 * 测试搜索功能
 */
async function testSearchFunctionality() {
    const testQueries = ['6', '主播', '游戏', '好'];
    const sortMethods = ['relevance', 'popularity', 'recent', 'usage'];
    
    for (const query of testQueries) {
        for (const sortBy of sortMethods) {
            const results = await DanmukuDB.search(query, 5, sortBy);
            Utils.log(`搜索 "${query}" (${sortBy}): 找到 ${results.length} 条结果`);
        }
    }
}

/**
 * 清空数据库测试
 */
async function testClearDatabase() {
    Utils.log('=== 清空数据库测试 ===');
    
    const beforeCount = await DanmukuDB.getDataCount();
    Utils.log(`清空前数据量: ${beforeCount}`);
    
    const clearResult = await DanmukuDB.clear();
    if (clearResult) {
        const afterCount = await DanmukuDB.getDataCount();
        Utils.log(`清空后数据量: ${afterCount}`);
        Utils.log('数据库清空测试完成');
    } else {
        Utils.log('数据库清空失败', 'error');
    }
}

/**
 * 批量测试不同页数
 */
async function batchTest() {
    const testPages = [1, 3, 5];
    
    for (const pages of testPages) {
        Utils.log(`\n========== 测试导入 ${pages} 页 ==========`);
        await testDataImport(pages);
        
        // 每次测试间隔
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

// 导出测试函数供外部调用
export {
    testDataImport,
    testSearchFunctionality,
    testClearDatabase,
    batchTest
};

// 如果直接运行此脚本
if (typeof window !== 'undefined') {
    // 浏览器环境 - 挂载到全局对象
    window.DanmukuTestUtils = {
        testDataImport,
        testSearchFunctionality,
        testClearDatabase,
        batchTest
    };
    
    Utils.log('测试工具已加载，可以使用以下命令:');
    Utils.log('- DanmukuTestUtils.testDataImport(5) // 测试导入5页数据');
    Utils.log('- DanmukuTestUtils.testSearchFunctionality() // 测试搜索功能');
    Utils.log('- DanmukuTestUtils.testClearDatabase() // 清空数据库');
    Utils.log('- DanmukuTestUtils.batchTest() // 批量测试');
}