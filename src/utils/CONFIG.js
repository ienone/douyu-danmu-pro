/**
 * =================================================================================
 * 斗鱼弹幕助手 - 配置常量
 * ---------------------------------------------------------------------------------
 * 应用程序的所有配置常量定义
 * =================================================================================
 */

export const CONFIG = {
    // 脚本标识
    SCRIPT_PREFIX: '[斗鱼弹幕助手]',
    
    // 数据库配置
    DB_NAME: 'DouyuDanmakuAssistant',
    DB_VERSION: 1,
    DB_STORE_NAME: 'danmaku_templates',
    
    // 设置存储前缀
    SETTINGS_KEY_PREFIX: 'dda_',
    
    // 搜索配置
    MIN_SEARCH_LENGTH: 1,      // 最小搜索长度
    MAX_SUGGESTIONS: 10,       // 最大建议数量
    DEBOUNCE_DELAY: 300,       // 防抖延迟（毫秒）
    
    // 键盘快捷键配置
    TRIGGER_KEYS: ['Tab'],                          // 触发候选项的键
    NAVIGATION_KEYS: ['ArrowUp', 'ArrowDown'],      // 导航键
    SELECT_KEYS: ['Enter', 'Tab'],                  // 选择键
    CANCEL_KEYS: ['Escape'],                        // 取消键
    
    // UI配置
    POPUP_SHOW_DELAY: 100,     // 弹窗显示延迟
    POPUP_HIDE_DELAY: 200,     // 弹窗隐藏延迟
    MAX_POPUP_HEIGHT: 300,     // 弹窗最大高度
    ITEM_HEIGHT: 40,           // 候选项高度
    
    // 动画配置
    ANIMATION_DURATION: 200,   // 动画持续时间
    
    // CSS类名
    CSS_CLASSES: {
        POPUP: 'dda-popup',
        POPUP_SHOW: 'show',
        POPUP_CONTENT: 'dda-popup-content',
        POPUP_ITEM: 'dda-popup-item',
        POPUP_ITEM_ACTIVE: 'dda-popup-item-active',
        POPUP_ITEM_TEXT: 'dda-popup-item-text',
        POPUP_EMPTY: 'dda-popup-empty',
        EMPTY_MESSAGE: 'dda-empty-message',
        PREVIEW_BAR: 'input-preview-bar',
        SEND_BUTTON: 'send-button'
    }
};
