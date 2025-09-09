/**
 * =================================================================================
 * 斗鱼弹幕助手 - 弹幕数据库
 * ---------------------------------------------------------------------------------
 * 作为与 IndexedDB 交互的唯一接口，提供数据模型的定义以及CRUD操作
 * =================================================================================
 */

import { CONFIG } from '../utils/CONFIG.js';
import { Utils } from '../utils/utils.js';

/**
 * 弹幕数据库管理器
 */
export const DanmakuDB = {
    
    // 数据库实例
    db: null,
    
    // 数据库是否已初始化
    initialized: false,
    
    /**
     * 初始化数据库
     * @returns {Promise<boolean>} 初始化是否成功
     */
    async init() {
        if (this.initialized) {
            return true;
        }
        
        try {
            this.db = await this._openDatabase();
            this.initialized = true;
            Utils.log('弹幕数据库初始化成功');
            return true;
        } catch (error) {
            Utils.log(`弹幕数据库初始化失败: ${error.message}`, 'error');
            return false;
        }
    },
    
    /**
     * 打开数据库
     * @returns {Promise<IDBDatabase>} 数据库实例
     * @private
     */
    _openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);
            
            request.onerror = () => {
                reject(new Error('数据库打开失败'));
            };
            
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 创建弹幕模板存储对象
                if (!db.objectStoreNames.contains(CONFIG.DB_STORE_NAME)) {
                    const store = db.createObjectStore(CONFIG.DB_STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    
                    // 创建索引
                    store.createIndex('text', 'text', { unique: false });
                    store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                    store.createIndex('syncState', 'syncState', { unique: false });
                    store.createIndex('lastUsed', 'lastUsed', { unique: false });
                    store.createIndex('useCount', 'useCount', { unique: false });
                }
            };
        });
    },
    
    /**
     * 添加弹幕模板
     * @param {string} text - 弹幕文本
     * @param {string[]} tags - 标签数组
     * @returns {Promise<number|null>} 新增记录的ID或null
     */
    async add(text, tags = []) {
        if (!this.initialized) {
            Utils.log('数据库未初始化', 'error');
            return null;
        }
        
        try {
            const danmakuData = {
                text: text.trim(),
                tags: tags.filter(tag => tag.trim()),
                syncState: 'pending', // 待同步状态
                createdAt: Date.now(),
                lastUsed: Date.now(),
                useCount: 1
            };
            
            const transaction = this.db.transaction([CONFIG.DB_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CONFIG.DB_STORE_NAME);
            const request = store.add(danmakuData);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = (event) => {
                    Utils.log(`弹幕模板添加成功: ${text}`);
                    resolve(event.target.result);
                };
                
                request.onerror = () => {
                    reject(new Error('添加弹幕模板失败'));
                };
            });
        } catch (error) {
            Utils.log(`添加弹幕模板异常: ${error.message}`, 'error');
            return null;
        }
    },
    
    /**
     * 搜索弹幕模板
     * @param {string} query - 搜索关键词
     * @param {number} limit - 限制结果数量
     * @returns {Promise<Array>} 匹配的弹幕模板数组
     */
    async search(query, limit = CONFIG.MAX_SUGGESTIONS) {
        if (!this.initialized || !query) {
            return [];
        }
        
        try {
            const transaction = this.db.transaction([CONFIG.DB_STORE_NAME], 'readonly');
            const store = transaction.objectStore(CONFIG.DB_STORE_NAME);
            const request = store.getAll();
            
            return new Promise((resolve) => {
                request.onsuccess = (event) => {
                    const allData = event.target.result;
                    const queryLower = query.toLowerCase();
                    
                    // 搜索匹配项
                    const matches = allData
                        .filter(item => {
                            return item.text.toLowerCase().includes(queryLower) ||
                                   item.tags.some(tag => tag.toLowerCase().includes(queryLower));
                        })
                        .sort((a, b) => {
                            // 按使用频率和最近使用时间排序
                            const scoreA = a.useCount * 0.7 + (Date.now() - a.lastUsed) * -0.3;
                            const scoreB = b.useCount * 0.7 + (Date.now() - b.lastUsed) * -0.3;
                            return scoreB - scoreA;
                        })
                        .slice(0, limit);
                    
                    resolve(matches);
                };
                
                request.onerror = () => {
                    Utils.log('搜索弹幕模板失败', 'error');
                    resolve([]);
                };
            });
        } catch (error) {
            Utils.log(`搜索弹幕模板异常: ${error.message}`, 'error');
            return [];
        }
    },
    
    /**
     * 更新弹幕模板使用统计
     * @param {number} id - 弹幕模板ID
     * @returns {Promise<boolean>} 是否更新成功
     */
    async updateUsage(id) {
        if (!this.initialized) {
            return false;
        }
        
        try {
            const transaction = this.db.transaction([CONFIG.DB_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CONFIG.DB_STORE_NAME);
            
            // 先获取现有数据
            const getRequest = store.get(id);
            
            return new Promise((resolve) => {
                getRequest.onsuccess = (event) => {
                    const data = event.target.result;
                    if (data) {
                        // 更新使用统计
                        data.useCount = (data.useCount || 0) + 1;
                        data.lastUsed = Date.now();
                        
                        const putRequest = store.put(data);
                        putRequest.onsuccess = () => resolve(true);
                        putRequest.onerror = () => resolve(false);
                    } else {
                        resolve(false);
                    }
                };
                
                getRequest.onerror = () => resolve(false);
            });
        } catch (error) {
            Utils.log(`更新使用统计异常: ${error.message}`, 'error');
            return false;
        }
    },
    
    /**
     * 删除弹幕模板
     * @param {number} id - 弹幕模板ID
     * @returns {Promise<boolean>} 是否删除成功
     */
    async delete(id) {
        if (!this.initialized) {
            return false;
        }
        
        try {
            const transaction = this.db.transaction([CONFIG.DB_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CONFIG.DB_STORE_NAME);
            const request = store.delete(id);
            
            return new Promise((resolve) => {
                request.onsuccess = () => {
                    Utils.log(`弹幕模板删除成功: ID ${id}`);
                    resolve(true);
                };
                
                request.onerror = () => {
                    Utils.log(`弹幕模板删除失败: ID ${id}`, 'error');
                    resolve(false);
                };
            });
        } catch (error) {
            Utils.log(`删除弹幕模板异常: ${error.message}`, 'error');
            return false;
        }
    },
    
    /**
     * 获取所有弹幕模板
     * @returns {Promise<Array>} 所有弹幕模板
     */
    async getAll() {
        if (!this.initialized) {
            return [];
        }
        
        try {
            const transaction = this.db.transaction([CONFIG.DB_STORE_NAME], 'readonly');
            const store = transaction.objectStore(CONFIG.DB_STORE_NAME);
            const request = store.getAll();
            
            return new Promise((resolve) => {
                request.onsuccess = (event) => {
                    resolve(event.target.result || []);
                };
                
                request.onerror = () => {
                    Utils.log('获取所有弹幕模板失败', 'error');
                    resolve([]);
                };
            });
        } catch (error) {
            Utils.log(`获取所有弹幕模板异常: ${error.message}`, 'error');
            return [];
        }
    },
    
    /**
     * 清空数据库
     * @returns {Promise<boolean>} 是否清空成功
     */
    async clear() {
        if (!this.initialized) {
            return false;
        }
        
        try {
            const transaction = this.db.transaction([CONFIG.DB_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CONFIG.DB_STORE_NAME);
            const request = store.clear();
            
            return new Promise((resolve) => {
                request.onsuccess = () => {
                    Utils.log('弹幕数据库已清空');
                    resolve(true);
                };
                
                request.onerror = () => {
                    Utils.log('清空弹幕数据库失败', 'error');
                    resolve(false);
                };
            });
        } catch (error) {
            Utils.log(`清空数据库异常: ${error.message}`, 'error');
            return false;
        }
    }
};
