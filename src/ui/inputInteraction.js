/**
 * =================================================================================
 * 斗鱼弹幕助手 - 输入框交互逻辑
 * ---------------------------------------------------------------------------------
 * 处理输入框联动及预览逻辑，协调输入框与候选项弹窗的交互
 * =================================================================================
 */

import { CONFIG } from '../utils/CONFIG.js';
import { NativeSetter } from '../utils/nativeSetter.js';

/**
 * 输入框交互管理器
 */
export const InputInteraction = {
    
    // 当前活跃的输入框
    activeInput: null,
    
    // 输入框事件监听器映射
    inputListeners: new Map(),
    
    // 预览模式标记
    isPreviewMode: false,
    
    // 原始输入值（预览前的值）
    originalInputValue: '',
    
    /**
     * 初始化输入框交互
     */
    init() {
        this.bindGlobalEvents();
        console.log('InputInteraction initialized');
    },
    
    /**
     * 绑定输入框事件
     * @param {HTMLElement} inputEl - 输入框元素
     */
    bindInputEvents(inputEl) {
        if (!inputEl || this.inputListeners.has(inputEl)) {
            return; // 已经绑定过或元素无效
        }
        
        // 创建事件监听器
        const listeners = {
            focus: (event) => this._handleInputFocus(event, inputEl),
            blur: (event) => this._handleInputBlur(event, inputEl),
            input: (event) => this._handleInputChange(event, inputEl),
            keydown: (event) => this._handleInputKeyDown(event, inputEl)
        };
        
        // 绑定事件
        Object.entries(listeners).forEach(([eventName, listener]) => {
            inputEl.addEventListener(eventName, listener);
        });
        
        // 保存监听器引用，用于后续清理
        this.inputListeners.set(inputEl, listeners);
    },
    
    /**
     * 解绑输入框事件
     * @param {HTMLElement} inputEl - 输入框元素
     */
    unbindInputEvents(inputEl) {
        if (!this.inputListeners.has(inputEl)) return;
        
        const listeners = this.inputListeners.get(inputEl);
        
        // 移除事件监听器
        Object.entries(listeners).forEach(([eventName, listener]) => {
            inputEl.removeEventListener(eventName, listener);
        });
        
        // 清理引用
        this.inputListeners.delete(inputEl);
    },
    
    /**
     * 替换输入内容为预览
     * @param {HTMLElement} inputEl - 输入框元素
     * @param {string} previewText - 预览文本
     */
    replaceInputWithPreview(inputEl, previewText) {
        if (!inputEl) return;
        
        // 保存原始值
        if (!this.isPreviewMode) {
            this.originalInputValue = inputEl.value;
            this.isPreviewMode = true;
        }
        
        // 使用原生Setter设置预览文本
        NativeSetter.setValue(inputEl, previewText);
        
        // 设置光标到末尾
        this._setCursorToEnd(inputEl);
        
        // 添加预览标记
        inputEl.classList.add('preview-mode');
    },
    
    /**
     * 恢复输入框原始内容
     * @param {HTMLElement} inputEl - 输入框元素
     */
    restoreOriginalInput(inputEl) {
        if (!inputEl || !this.isPreviewMode) return;
        
        // 使用原生Setter恢复原始值
        NativeSetter.setValue(inputEl, this.originalInputValue);
        this.isPreviewMode = false;
        this.originalInputValue = '';
        
        // 移除预览标记
        inputEl.classList.remove('preview-mode');
    },
    
    /**
     * 确认预览内容（将预览文本作为正式输入）
     * @param {HTMLElement} inputEl - 输入框元素
     */
    confirmPreview(inputEl) {
        if (!inputEl || !this.isPreviewMode) return;
        
        // 清除预览模式标记，但保持当前文本
        this.isPreviewMode = false;
        this.originalInputValue = '';
        
        // 移除预览标记
        inputEl.classList.remove('preview-mode');
        
        // 触发input事件
        this._triggerInputEvent(inputEl);
    },
    
    /**
     * 检查输入框是否处于预览模式
     * @param {HTMLElement} inputEl - 输入框元素
     * @returns {boolean} 是否为预览模式
     */
    isInPreviewMode(inputEl) {
        return inputEl && inputEl.classList.contains('preview-mode');
    },
    
    /**
     * 获取当前活跃的输入框
     * @returns {HTMLElement|null} 活跃的输入框元素
     */
    getActiveInput() {
        return this.activeInput;
    },
    
    /**
     * 绑定全局事件
     */
    bindGlobalEvents() {
        // 监听预览发送事件
        document.addEventListener('previewSend', (event) => {
            const { text, targetInput } = event.detail;
            this._handlePreviewSend(text, targetInput);
        });
        
        // 监听候选项选择事件
        document.addEventListener('candidateSelected', (event) => {
            const { candidate } = event.detail;
            this._handleCandidateSelected(candidate);
        });
    },
    
    /**
     * 处理输入框获得焦点
     * @param {Event} event - 焦点事件
     * @param {HTMLElement} inputEl - 输入框元素
     * @private
     */
    _handleInputFocus(event, inputEl) {
        this.activeInput = inputEl;
        
        // 触发焦点获得事件
        this._emitInputEvent('inputFocused', { inputEl, event });
    },
    
    /**
     * 处理输入框失去焦点
     * @param {Event} event - 失焦事件
     * @param {HTMLElement} inputEl - 输入框元素
     * @private
     */
    _handleInputBlur(event, inputEl) {
        // 延迟处理，给候选项点击事件一些时间
        setTimeout(() => {
            if (this.activeInput === inputEl) {
                this.activeInput = null;
                
                // 如果在预览模式，恢复原始内容
                if (this.isPreviewMode) {
                    this.restoreOriginalInput(inputEl);
                }
                
                // 触发失焦事件
                this._emitInputEvent('inputBlurred', { inputEl, event });
            }
        }, 200);
    },
    
    /**
     * 处理输入框内容变化
     * @param {Event} event - 输入事件
     * @param {HTMLElement} inputEl - 输入框元素
     * @private
     */
    _handleInputChange(event, inputEl) {
        // 如果在预览模式下，用户手动修改了内容，则退出预览模式
        if (this.isPreviewMode) {
            this.isPreviewMode = false;
            this.originalInputValue = '';
            inputEl.classList.remove('preview-mode');
        }
        
        // 触发输入变化事件
        this._emitInputEvent('inputChanged', { 
            inputEl, 
            value: inputEl.value, 
            event 
        });
    },
    
    /**
     * 处理输入框按键事件
     * @param {KeyboardEvent} event - 键盘事件
     * @param {HTMLElement} inputEl - 输入框元素
     * @private
     */
    _handleInputKeyDown(event, inputEl) {
        // 触发按键事件
        this._emitInputEvent('inputKeyDown', { 
            inputEl, 
            key: event.key, 
            event 
        });
    },
    
    /**
     * 处理预览发送
     * @param {string} text - 发送的文本
     * @param {HTMLElement} targetInput - 目标输入框
     * @private
     */
    _handlePreviewSend(text, targetInput) {
        if (targetInput) {
            // 使用原生Setter设置输入框值
            NativeSetter.setValue(targetInput, text);
            
            // 确认预览
            this.confirmPreview(targetInput);
            
            // 模拟发送操作（可以根据实际需要调整）
            this._simulateSend(targetInput);
        }
    },
    
    /**
     * 处理候选项选择
     * @param {Object} candidate - 选中的候选项
     * @private
     */
    _handleCandidateSelected(candidate) {
        if (this.activeInput && candidate) {
            const text = candidate.getDisplayText ? candidate.getDisplayText() : candidate.text;
            this.replaceInputWithPreview(this.activeInput, text);
        }
    },
    
    /**
     * 触发输入框事件
     * @param {string} eventName - 事件名称
     * @param {Object} detail - 事件详情
     * @private
     */
    _emitInputEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    },
    
    /**
     * 触发input事件
     * @param {HTMLElement} inputEl - 输入框元素
     * @private
     */
    _triggerInputEvent(inputEl) {
        const inputEvent = new Event('input', { bubbles: true });
        inputEl.dispatchEvent(inputEvent);
    },
    
    /**
     * 设置光标到输入框末尾
     * @param {HTMLElement} inputEl - 输入框元素
     * @private
     */
    _setCursorToEnd(inputEl) {
        if (inputEl.setSelectionRange) {
            const len = inputEl.value.length;
            inputEl.setSelectionRange(len, len);
        }
    },
    
    /**
     * 模拟发送操作
     * @param {HTMLElement} inputEl - 输入框元素
     * @private
     */
    _simulateSend(inputEl) {
        // 模拟按下回车键
        const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            bubbles: true
        });
        inputEl.dispatchEvent(enterEvent);
    },
    
    /**
     * 清理所有事件监听器
     */
    cleanup() {
        // 清理所有输入框事件监听器
        for (const inputEl of this.inputListeners.keys()) {
            this.unbindInputEvents(inputEl);
        }
        
        this.activeInput = null;
        this.isPreviewMode = false;
        this.originalInputValue = '';
    }
};