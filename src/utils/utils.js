import { CONFIG } from './CONFIG.js';

/**
 * =================================================================================
 * 斗鱼弹幕助手 - 通用工具函数
 * ---------------------------------------------------------------------------------
 * 提供与业务逻辑无关的、可复用的辅助函数
 * =================================================================================
 */
export const Utils = {
    
    /**
     * 打印带脚本前缀的日志
     * @param {string} message - 要打印的消息
     * @param {string} level - 日志级别 ('log', 'warn', 'error')
     */
    log(message, level = 'log') {
        const logMsg = `${CONFIG.SCRIPT_PREFIX} ${message}`;
        try {
            if (typeof GM_log !== 'undefined') {
                GM_log(logMsg);
            } else {
                console[level](logMsg);
            }
        } catch (e) {
            console[level](logMsg);
        }
    },

    /**
     * 异步等待指定时间
     * @param {number} ms - 等待的毫秒数
     * @returns {Promise} Promise对象
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} delay - 防抖延迟时间
     * @returns {Function} 防抖后的函数
     */
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * 节流函数
     * @param {Function} func - 要节流的函数
     * @param {number} delay - 节流延迟时间
     * @returns {Function} 节流后的函数
     */
    throttle(func, delay) {
        let lastCall = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                return func.apply(this, args);
            }
        };
    },

    /**
     * 获取当前页面的房间号
     * @returns {string|null} 房间号或 null
     */
    getCurrentRoomId() {
        const match = window.location.href.match(
            /douyu\.com\/(?:beta\/)?(?:topic\/[^?]+\?rid=|(\d+))/
        );
        return match ? (match[1] || 
            new URLSearchParams(window.location.search).get('rid')) : null;
    },

    /**
     * 检查是否在斗鱼直播间页面
     * @returns {boolean} 是否在直播间页面
     */
    isInLiveRoom() {
        const roomId = this.getCurrentRoomId();
        return roomId !== null && document.querySelector('[data-v-5aa519d2]'); // 斗鱼聊天区域特征
    },

    /**
     * 获取元素的绝对位置
     * @param {HTMLElement} element - 目标元素
     * @returns {object} 包含 x, y, width, height 的位置信息
     */
    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height
        };
    },

    /**
     * 安全地执行函数，捕获异常
     * @param {Function} func - 要执行的函数
     * @param {string} context - 执行上下文（用于错误日志）
     * @returns {*} 函数执行结果或 null
     */
    safeExecute(func, context = 'unknown') {
        try {
            return func();
        } catch (error) {
            this.log(`执行函数时出错 [${context}]: ${error.message}`, 'error');
            return null;
        }
    },

    /**
     * 生成唯一ID
     * @param {string} prefix - ID前缀
     * @returns {string} 唯一ID
     */
    generateId(prefix = 'dda') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * 深拷贝对象
     * @param {*} obj - 要拷贝的对象
     * @returns {*} 拷贝后的对象
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    }
};