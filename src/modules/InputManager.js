/**
 * =================================================================================
 * 斗鱼弹幕助手 - 输入管理器（中央状态机）
 * ---------------------------------------------------------------------------------
 * 统一管理用户交互流程：IDLE -> TYPING -> SELECTING
 * =================================================================================
 */

import { CONFIG } from '../utils/CONFIG.js';
import { DanmakuDB } from './DanmakuDB.js';
import { UIManager } from './UIManager.js';
import { KeyboardController } from './KeyboardController.js';

/**
 * 应用状态枚举
 */
export const APP_STATES = {
    IDLE: 'idle',           // 空闲状态，等待用户输入
    TYPING: 'typing',       // 用户正在输入
    SELECTING: 'selecting'  // 用户正在选择候选项
};

/**
 * 输入管理器 - 中央状态机
 */
export const InputManager = {
    
    // 当前状态
    currentState: APP_STATES.IDLE,
    
    // 当前输入框元素
    currentInput: null,
    
    // 当前候选项列表
    currentSuggestions: [],
    
    // 防抖定时器
    debounceTimer: null,
    
    /**
     * 初始化输入管理器
     */
    async init() {
        // 初始化UIManager
        await UIManager.init();
        
        this.bindInputEvents();
        console.log('InputManager initialized');
    },
    
    /**
     * 绑定输入框事件
     */
    bindInputEvents() {
        // 监听所有输入框的焦点事件
        document.addEventListener('focusin', this.handleFocusIn.bind(this));
        document.addEventListener('focusout', this.handleFocusOut.bind(this));
        
        // 监听键盘事件
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('input', this.handleInput.bind(this));
    },
    
    /**
     * 处理输入框获得焦点
     */
    handleFocusIn(event) {
        const target = event.target;
        
        // 检查是否是聊天输入框（根据斗鱼页面结构判断）
        if (this.isChatInput(target)) {
            this.currentInput = target;
            this.setState(APP_STATES.IDLE);
        }
    },
    
    /**
     * 处理输入框失去焦点
     */
    handleFocusOut(event) {
        if (event.target === this.currentInput) {
            this.setState(APP_STATES.IDLE);
            this.currentInput = null;
            UIManager.hidePopup();
        }
    },
    
    /**
     * 处理键盘按下事件
     */
    handleKeyDown(event) {
        if (!this.currentInput) return;
        
        KeyboardController.handleKeyDown(event, this.currentState);
    },
    
    /**
     * 处理输入事件
     */
    handleInput(event) {
        if (event.target !== this.currentInput) return;
        
        const inputValue = event.target.value;
        
        // 清除之前的防抖定时器
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        // 设置新的防抖定时器
        this.debounceTimer = setTimeout(() => {
            this.processInput(inputValue);
        }, CONFIG.DEBOUNCE_DELAY);
    },
    
    /**
     * 处理输入内容
     */
    async processInput(inputValue) {
        if (inputValue.length < CONFIG.MIN_SEARCH_LENGTH) {
            this.setState(APP_STATES.IDLE);
            UIManager.hidePopup();
            return;
        }
        
        this.setState(APP_STATES.TYPING);
        
        // 从数据库搜索匹配的弹幕模板
        const suggestions = await DanmakuDB.search(inputValue);
        this.currentSuggestions = suggestions;
        
        if (suggestions.length > 0) {
            this.setState(APP_STATES.SELECTING);
            UIManager.showPopup(suggestions, this.currentInput);
        } else {
            UIManager.hidePopup();
        }
    },
    
    /**
     * 设置当前状态
     */
    setState(newState) {
        const oldState = this.currentState;
        this.currentState = newState;
        
        console.log(`State changed: ${oldState} -> ${newState}`);
        
        // 触发状态变化事件
        this.onStateChange(oldState, newState);
    },
    
    /**
     * 状态变化回调
     */
    onStateChange(oldState, newState) {
        switch (newState) {
            case APP_STATES.IDLE:
                UIManager.hidePopup();
                break;
            case APP_STATES.TYPING:
                // 保持当前UI状态
                break;
            case APP_STATES.SELECTING:
                // 高亮第一个候选项
                UIManager.setActiveIndex(0);
                break;
        }
    },
    
    /**
     * 判断元素是否是聊天输入框
     */
    isChatInput(element) {
        // TODO: 根据斗鱼页面的实际结构来判断
        // 这里需要分析斗鱼聊天输入框的特征
        return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
    },
    
    /**
     * 选择候选项
     */
    selectSuggestion(index) {
        if (index < 0 || index >= this.currentSuggestions.length) return;
        
        const suggestion = this.currentSuggestions[index];
        if (this.currentInput && suggestion) {
            // 使用UIManager选择候选项
            UIManager.selectCandidate(suggestion);
            this.setState(APP_STATES.IDLE);
        }
    }
};
