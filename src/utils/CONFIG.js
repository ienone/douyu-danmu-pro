/**
 * =================================================================================
 * 斗鱼弹幕助手 - 配置常量
 * ---------------------------------------------------------------------------------
 * 应用程序的所有配置常量定义
 * =================================================================================
 */

// 静态配置常量（不可变）
export const CONFIG = {
    // 脚本标识
    SCRIPT_PREFIX: '[斗鱼弹幕助手]',
    
    // 数据库配置
    DB_NAME: 'DouyuDanmakuAssistant',
    DB_VERSION: 1,
    DB_STORE_NAME: 'danmaku_templates',
    
    // 设置存储前缀
    SETTINGS_KEY_PREFIX: 'dda_',
    
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
    },
    
    // 键盘事件配置
    KEYBOARD: {
        ENTER: 'Enter',
        ESCAPE: 'Escape',
        ARROW_UP: 'ArrowUp',
        ARROW_DOWN: 'ArrowDown',
        ARROW_LEFT: 'ArrowLeft',
        ARROW_RIGHT: 'ArrowRight',
        TAB: 'Tab',
        BACKSPACE: 'Backspace'
    },
    
    // 预览配置
    PREVIEW: {
        USER_INPUT_COLOR: '#000000',
        PREVIEW_TEXT_COLOR: '#999999',
        PREVIEW_BACKGROUND_COLOR: 'rgba(153, 153, 153, 0.1)',
        DEBOUNCE_DELAY: 300 // 防抖延迟
    }
};

// 默认用户设置（用户可配置）
export const DEFAULT_SETTINGS = {
    // 搜索配置
    minSearchLength: 1,        // 最小搜索长度
    maxSuggestions: 10,        // 最大建议数量
    debounceDelay: 300,        // 防抖延迟（毫秒）
    
    // 键盘快捷键配置
    triggerKeys: ['Tab'],                           // 触发候选项的键
    navigationKeys: ['ArrowUp', 'ArrowDown'],       // 导航键
    selectKeys: ['Enter', 'Tab'],                   // 选择键
    cancelKeys: ['Escape'],                         // 取消键
    
    // UI配置
    popupShowDelay: 100,       // 弹窗显示延迟
    popupHideDelay: 200,       // 弹窗隐藏延迟
    maxPopupHeight: 300,       // 弹窗最大高度
    itemHeight: 40,            // 候选项高度
    
    // 动画配置
    animationDuration: 200,    // 动画持续时间
    
    // 功能开关
    enableAutoComplete: true,   // 启用自动补全
    enableKeyboardShortcuts: true, // 启用键盘快捷键
    enablePreview: true         // 启用预览功能
};
