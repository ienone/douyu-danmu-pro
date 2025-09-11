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
import { InputDetector, INPUT_TYPES } from './InputDetector.js';
import { NativeSetter } from '../utils/NativeSetter.js';

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
    
    // 已处理的输入框
    processedInputs: new WeakSet(),
    
    /**
     * 初始化输入管理器
     */
    async init() {
        // 初始化NativeSetter
        NativeSetter.init();
        
        // 初始化UIManager
        await UIManager.init();
        
        // 初始化InputDetector
        InputDetector.init({
            onInputDetected: this.handleInputDetected.bind(this),
            onInputRemoved: this.handleInputRemoved.bind(this)
        });
        
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
     * 处理检测到新输入框
     * @param {HTMLElement} input - 输入框元素
     * @param {string} type - 输入框类型
     */
    handleInputDetected(input, type) {
        if (this.processedInputs.has(input)) return;
        
        this.processedInputs.add(input);
        console.log(`Processing detected input of type: ${type}`);
        
        // 根据类型进行特殊处理
        this.setupInputByType(input, type);
    },
    
    /**
     * 处理输入框移除
     * @param {HTMLElement} input - 输入框元素
     * @param {string} type - 输入框类型
     */
    handleInputRemoved(input, type) {
        if (!this.processedInputs.has(input)) return;
        
        this.processedInputs.delete(input);
        
        // 如果是当前活跃输入框，清理状态
        if (this.currentInput === input) {
            this.currentInput = null;
            this.setState(APP_STATES.IDLE);
            UIManager.hidePopup();
        }
        
        console.log(`Removed input of type: ${type}`);
    },
    
    /**
     * 根据输入框类型进行设置
     * @param {HTMLElement} input - 输入框元素
     * @param {string} type - 输入框类型
     */
    setupInputByType(input, type) {
        switch (type) {
            case INPUT_TYPES.MAIN_CHAT:
                this.setupMainChatInput(input);
                break;
            case INPUT_TYPES.FULLSCREEN_FLOAT:
                this.setupFullscreenInput(input);
                break;
        }
    },
    
    /**
     * 设置主聊天区输入框
     * @param {HTMLElement} input - 输入框元素
     */
    setupMainChatInput(input) {
        // 主聊天区输入框需要在focus时才处理，避免与框架冲突
        const focusHandler = (event) => {
            this.currentInput = input;
            this.setState(APP_STATES.IDLE);
            console.log('Main chat input focused and activated');
        };
        
        input.addEventListener('focus', focusHandler, { once: true });
        
        // 重新绑定focus事件，确保每次focus都能激活
        input.addEventListener('blur', () => {
            setTimeout(() => {
                input.addEventListener('focus', focusHandler, { once: true });
            }, 100);
        });
    },
    
    /**
     * 设置全屏浮动输入框
     * @param {HTMLElement} input - 输入框元素
     */
    setupFullscreenInput(input) {
        // 全屏浮动输入框可以立即处理
        console.log('Fullscreen input setup completed');
        
        const focusHandler = (event) => {
            this.currentInput = input;
            this.setState(APP_STATES.IDLE);
            console.log('Fullscreen input focused and activated');
        };
        
        input.addEventListener('focus', focusHandler);
    },
    
    /**
     * 处理输入框获得焦点
     */
    handleFocusIn(event) {
        const target = event.target;
        
        // 检查是否是我们识别的聊天输入框
        if (InputDetector.isChatInput(target)) {
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
        // 使用InputDetector进行精确判断
        return InputDetector.isChatInput(element);
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
