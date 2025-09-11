/**
 * =================================================================================
 * 斗鱼弹幕助手 - 输入框预览组件
 * ---------------------------------------------------------------------------------
 * 显示预览内容及发送按钮，处理发送逻辑
 * =================================================================================
 */

import { CONFIG } from '../utils/CONFIG.js';

/**
 * 输入预览组件
 */
export const InputPreview = {
    
    // 预览容器元素
    previewElement: null,
    
    // 预览文本元素
    previewTextElement: null,
    
    // 发送按钮元素
    sendButtonElement: null,
    
    // 目标输入框
    targetInput: null,
    
    // 当前预览文本
    currentPreviewText: '',
    
    /**
     * 初始化预览组件
     */
    init() {
        this.createPreviewDOM();
        console.log('InputPreview initialized');
    },
    
    /**
     * 创建预览DOM结构
     */
    createPreviewDOM() {
        // 创建预览容器
        this.previewElement = document.createElement('div');
        this.previewElement.className = CONFIG.CSS_CLASSES.PREVIEW_BAR;
        this.previewElement.style.display = 'none';
        
        // 创建预览文本元素
        this.previewTextElement = document.createElement('div');
        this.previewTextElement.className = 'preview-text';
        
        // 创建发送按钮
        this.sendButtonElement = document.createElement('button');
        this.sendButtonElement.className = CONFIG.CSS_CLASSES.SEND_BUTTON;
        this.sendButtonElement.textContent = '发送';
        this.sendButtonElement.type = 'button';
        
        // 组装DOM结构
        this.previewElement.appendChild(this.previewTextElement);
        this.previewElement.appendChild(this.sendButtonElement);
        
        // 添加到页面
        document.body.appendChild(this.previewElement);
        
        // 绑定事件
        this.bindPreviewEvents();
    },
    
    /**
     * 渲染输入预览
     * @param {string} previewText - 预览文本
     * @param {HTMLElement} targetInput - 目标输入框
     */
    renderInputPreview(previewText, targetInput) {
        this.currentPreviewText = previewText;
        this.targetInput = targetInput;
        
        // 更新预览文本
        this.previewTextElement.textContent = previewText;
        
        // 显示预览栏
        this.showPreview(targetInput);
    },
    
    /**
     * 显示预览栏
     * @param {HTMLElement} targetInput - 目标输入框
     */
    showPreview(targetInput) {
        if (!targetInput) return;
        
        // 定位预览栏
        this._positionPreview(targetInput);
        
        // 显示预览栏
        this.previewElement.style.display = 'flex';
        
        // 添加显示动画类（如果有）
        requestAnimationFrame(() => {
            this.previewElement.classList.add('show');
        });
    },
    
    /**
     * 隐藏预览栏
     */
    hidePreview() {
        this.previewElement.classList.remove('show');
        
        setTimeout(() => {
            this.previewElement.style.display = 'none';
        }, CONFIG.ANIMATION_DURATION);
    },
    
    /**
     * 绑定预览相关事件
     */
    bindPreviewEvents() {
        // 绑定发送按钮事件
        this.bindSendButton(this.sendButtonElement, () => this.currentPreviewText);
        
        // 绑定键盘事件
        document.addEventListener('keydown', (event) => {
            if (this.isVisible() && event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this._handleSend();
            }
        });
        
        // 防止预览栏内部点击事件冒泡
        this.previewElement.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    },
    
    /**
     * 绑定发送按钮事件
     * @param {HTMLElement} sendBtn - 发送按钮元素
     * @param {Function|string} previewTextGetter - 获取预览文本的函数或直接文本
     */
    bindSendButton(sendBtn, previewTextGetter) {
        sendBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            // 获取预览文本
            const previewText = typeof previewTextGetter === 'function' 
                ? previewTextGetter() 
                : previewTextGetter;
                
            this._handleSend(previewText);
        });
    },
    
    /**
     * 检查预览栏是否可见
     * @returns {boolean} 是否可见
     */
    isVisible() {
        return this.previewElement.style.display !== 'none';
    },
    
    /**
     * 获取当前预览文本
     * @returns {string} 预览文本
     */
    getPreviewText() {
        return this.currentPreviewText;
    },
    
    /**
     * 定位预览栏
     * @param {HTMLElement} targetInput - 目标输入框
     * @private
     */
    _positionPreview(targetInput) {
        const inputRect = targetInput.getBoundingClientRect();
        
        // 计算位置（输入框下方）
        let left = inputRect.left;
        let top = inputRect.bottom + 2;
        let width = inputRect.width;
        
        // 边界检查
        const windowWidth = window.innerWidth;
        if (left + width > windowWidth - 20) {
            width = windowWidth - left - 20;
        }
        
        // 应用样式
        this.previewElement.style.left = `${left}px`;
        this.previewElement.style.top = `${top}px`;
        this.previewElement.style.width = `${width}px`;
    },
    
    /**
     * 处理发送操作
     * @param {string} textToSend - 要发送的文本（可选）
     * @private
     */
    _handleSend(textToSend = null) {
        const text = textToSend || this.currentPreviewText;
        
        if (!text.trim()) return;
        
        // 触发发送事件
        this._emitSendEvent(text, this.targetInput);
        
        // 隐藏预览栏
        this.hidePreview();
    },
    
    /**
     * 触发发送事件
     * @param {string} text - 发送的文本
     * @param {HTMLElement} targetInput - 目标输入框
     * @private
     */
    _emitSendEvent(text, targetInput) {
        const event = new CustomEvent('previewSend', {
            detail: { text, targetInput }
        });
        document.dispatchEvent(event);
    },
    
    /**
     * 销毁预览组件
     */
    destroy() {
        if (this.previewElement && this.previewElement.parentNode) {
            this.previewElement.parentNode.removeChild(this.previewElement);
        }
        
        this.previewElement = null;
        this.previewTextElement = null;
        this.sendButtonElement = null;
        this.targetInput = null;
        this.currentPreviewText = '';
    }
};