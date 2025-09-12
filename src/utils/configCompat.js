/**
 * =================================================================================
 * 斗鱼弹幕助手 - 配置兼容性工具
 * ---------------------------------------------------------------------------------
 * 帮助代码从旧配置结构迁移到新配置结构的工具函数
 * =================================================================================
 */

import { CONFIG, DEFAULT_SETTINGS } from './CONFIG.js';

/**
 * 兼容性配置映射 - 将旧的 CONFIG 属性映射到新的 DEFAULT_SETTINGS
 */
const LEGACY_CONFIG_MAPPING = {
    'MIN_SEARCH_LENGTH': 'minSearchLength',
    'MAX_SUGGESTIONS': 'maxSuggestions',
    'ANIMATION_DURATION': 'animationDuration',
    'POPUP_SHOW_DELAY': 'popupShowDelay',
    'POPUP_HIDE_DELAY': 'popupHideDelay'
};

/**
 * 获取配置值 - 兼容旧版本引用
 * @param {string} key - 配置键名
 * @param {*} defaultValue - 默认值
 * @returns {*} 配置值
 */
export function getConfigValue(key, defaultValue = null) {
    // 首先检查是否是 CONFIG 中的开发者配置
    if (hasNestedProperty(CONFIG, key)) {
        return getNestedProperty(CONFIG, key);
    }
    
    // 检查是否是需要映射的旧配置
    if (LEGACY_CONFIG_MAPPING[key]) {
        const newKey = LEGACY_CONFIG_MAPPING[key];
        return DEFAULT_SETTINGS[newKey] || defaultValue;
    }
    
    // 直接检查 DEFAULT_SETTINGS
    if (DEFAULT_SETTINGS.hasOwnProperty(key)) {
        return DEFAULT_SETTINGS[key];
    }
    
    return defaultValue;
}

/**
 * 检查对象是否有嵌套属性
 * @param {object} obj - 对象
 * @param {string} path - 属性路径，如 'UI.ANIMATION_DURATION'
 * @returns {boolean}
 */
function hasNestedProperty(obj, path) {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return false;
        }
    }
    
    return true;
}

/**
 * 获取嵌套属性值
 * @param {object} obj - 对象
 * @param {string} path - 属性路径
 * @returns {*}
 */
function getNestedProperty(obj, path) {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
        current = current[key];
    }
    
    return current;
}

/**
 * 创建合并后的配置对象 - 用于代码迁移期间
 * @returns {object} 合并后的配置
 */
export function createMergedConfig() {
    return {
        ...CONFIG,
        ...DEFAULT_SETTINGS,
        // 保持旧版本兼容性的映射
        MIN_SEARCH_LENGTH: DEFAULT_SETTINGS.minSearchLength,
        MAX_SUGGESTIONS: DEFAULT_SETTINGS.maxSuggestions,
        ANIMATION_DURATION: DEFAULT_SETTINGS.animationDuration,
        POPUP_SHOW_DELAY: DEFAULT_SETTINGS.popupShowDelay,
        POPUP_HIDE_DELAY: DEFAULT_SETTINGS.popupHideDelay
    };
}

/**
 * 验证配置完整性
 * @returns {object} 验证结果
 */
export function validateConfig() {
    const issues = [];
    const warnings = [];
    
    // 检查必需的配置项
    const requiredConfigKeys = [
        'SCRIPT_PREFIX', 'DB_NAME', 'DB_VERSION', 'DB_STORE_NAME'
    ];
    
    for (const key of requiredConfigKeys) {
        if (!CONFIG[key]) {
            issues.push(`Missing required CONFIG key: ${key}`);
        }
    }
    
    // 检查必需的用户设置
    const requiredSettingKeys = [
        'minSearchLength', 'maxSuggestions', 'debounceDelay'
    ];
    
    for (const key of requiredSettingKeys) {
        if (DEFAULT_SETTINGS[key] === undefined) {
            issues.push(`Missing required DEFAULT_SETTINGS key: ${key}`);
        }
    }
    
    // 检查类型
    if (typeof DEFAULT_SETTINGS.minSearchLength !== 'number') {
        issues.push('minSearchLength must be a number');
    }
    
    if (typeof DEFAULT_SETTINGS.maxSuggestions !== 'number') {
        issues.push('maxSuggestions must be a number');
    }
    
    return {
        isValid: issues.length === 0,
        issues,
        warnings
    };
}

/**
 * 打印配置信息（调试用）
 */
export function printConfigInfo() {
    console.group('🔧 Configuration Info');
    console.log('CONFIG keys:', Object.keys(CONFIG));
    console.log('DEFAULT_SETTINGS keys:', Object.keys(DEFAULT_SETTINGS));
    
    const validation = validateConfig();
    if (validation.isValid) {
        console.log('✅ Configuration is valid');
    } else {
        console.warn('❌ Configuration issues:', validation.issues);
    }
    
    if (validation.warnings.length > 0) {
        console.warn('⚠️ Configuration warnings:', validation.warnings);
    }
    
    console.groupEnd();
}