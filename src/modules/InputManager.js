/**
 * =================================================================================
 * 斗鱼弹幕助手 - 输入管理器（中央状态机）
 * ---------------------------------------------------------------------------------
 * 统一管理用户交互流程：IDLE -> TYPING -> SELECTING
 * =================================================================================
 */

import { CONFIG } from '../utils/CONFIG.js';
import { EnhancedInputPreview } from '../ui/enhancedInputPreview.js';
import { DanmakuDB } from './DanmakuDB.js';
import { UIManager } from './UIManager.js';
import { KeyboardController } from './KeyboardController.js';
import { InputDetector, INPUT_TYPES } from './InputDetector.js';
import { NativeSetter } from '../utils/nativeSetter.js';

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
    
    // 添加防抖定时器
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
        console.log('=== InputManager.handleFocusOut 被调用 ===');
        console.log('失焦的元素:', event.target.className, 'value:', event.target.value);
        
        if (event.target === this.currentInput) {
            console.log('当前输入框失焦，检查是否应该隐藏候选项...');
            
            // 检查输入框是否还有内容
            const hasContent = this.currentInput && 
                this.currentInput.value && 
                this.currentInput.value.trim().length > 0;
            
            console.log('输入框有内容:', hasContent);
            
            this.setState(APP_STATES.IDLE);
            this.currentInput = null;
            
            // 只有在输入框为空时才隐藏候选项
            if (!hasContent) {
                console.log('输入框为空，隐藏候选项');
                UIManager.hidePopup();
            } else {
                console.log('输入框有内容，保持候选项显示');
            }
        }
    },
    
    /**
     * 处理输入事件
     */
    handleInput(event) {
        if (event.target !== this.currentInput) return;
        
        const inputValue = event.target.value;
        
        // 如果输入为空，立即隐藏候选项并清除预览
        if (inputValue.length === 0) {
            UIManager.hidePopup();
            EnhancedInputPreview.clearPreview();
            if (this.debounceTimer) clearTimeout(this.debounceTimer);
            return;
        }

        // 正常防抖处理输入
        this.debounceProcessInput(inputValue);
    },

    /**
     * 防抖处理输入
     * @param {string} inputValue - 输入值
     */
    debounceProcessInput(inputValue) {
        // 清除之前的定时器
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        // 设置新的定时器
        this.debounceTimer = setTimeout(() => {
            this.processInput(inputValue);
        }, CONFIG.PREVIEW.DEBOUNCE_DELAY);
    },
    
    /**
     * 处理键盘按下事件
     */
    handleKeyDown(event) {
        if (event.target !== this.currentInput) return;
        
        const key = event.key;
        
        // 如果是预览状态，优先处理预览相关按键
        if (EnhancedInputPreview.isPreviewActive()) {
            if (key === CONFIG.KEYBOARD.ENTER && !event.shiftKey) {
                event.preventDefault();
                EnhancedInputPreview.confirmPreview();
                return;
            } else if (key === CONFIG.KEYBOARD.ESCAPE) {
                event.preventDefault();
                EnhancedInputPreview.cancelPreview();
                return;
            }
        }
        
        // UI管理器可见时的按键处理
        if (UIManager.isPopupVisible()) {
            switch (key) {
                case CONFIG.KEYBOARD.ARROW_UP:
                    event.preventDefault();
                    UIManager.navigateUp();
                    break;
                case CONFIG.KEYBOARD.ARROW_DOWN:
                    event.preventDefault();
                    UIManager.navigateDown();
                    break;
                case CONFIG.KEYBOARD.ARROW_LEFT:
                    // 聊天输入框模式下的左箭头
                    if (this.currentInput.closest('.ChatSend')) {
                        event.preventDefault();
                        UIManager.navigateLeft();
                    }
                    break;
                case CONFIG.KEYBOARD.ARROW_RIGHT:
                    // 聊天输入框模式下的右箭头
                    if (this.currentInput.closest('.ChatSend')) {
                        event.preventDefault();
                        UIManager.navigateRight();
                    }
                    break;
                case CONFIG.KEYBOARD.ENTER:
                    if (!event.shiftKey) {
                        event.preventDefault();
                        UIManager.selectActiveCandidate();
                    }
                    break;
                case CONFIG.KEYBOARD.ESCAPE:
                    event.preventDefault();
                    UIManager.hidePopup();
                    break;
                case CONFIG.KEYBOARD.TAB:
                    event.preventDefault();
                    UIManager.selectActiveCandidate();
                    break;
            }
        }
    },
    
    /**
     * 处理输入内容
     */
    async processInput(inputValue) {
        if (inputValue.length < CONFIG.MIN_SEARCH_LENGTH) {
            this.setState(APP_STATES.IDLE);
            UIManager.hidePopup(); // 明确隐藏弹窗
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
            UIManager.hidePopup(); // 明确隐藏弹窗
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
        console.log(`=== onStateChange: ${oldState} -> ${newState} ===`);
        
        switch (newState) {
            case APP_STATES.IDLE:
                // 不要在这里无条件隐藏弹窗
                // 让具体的调用场景来决定是否隐藏
                console.log('状态变为IDLE，但不自动隐藏弹窗');
                break;
            case APP_STATES.TYPING:
                // 保持当前UI状态
                console.log('状态变为TYPING');
                break;
            case APP_STATES.SELECTING:
                // 高亮第一个候选项
                console.log('状态变为SELECTING，设置活跃索引');
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
