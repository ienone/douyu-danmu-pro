/**
 * =================================================================================
 * 增强的输入预览组件 (v2 - 伪元素方案)
 * ---------------------------------------------------------------------------------
 * 利用CSS伪元素实现预览，避免干扰输入框原生行为
 * =================================================================================
 */
import { Utils } from '../utils/utils.js';
import { NativeSetter } from '../utils/nativeSetter.js';

export const EnhancedInputPreview = {
    
    previewState: {
        isActive: false,
        userInput: '',
        previewText: '',
        targetInput: null,
    },

    /**
     * 显示预览
     * @param {HTMLElement} inputEl - 目标输入框
     * @param {string} userInput - 用户实际输入的部分
     * @param {string} previewText - 完整的候选项文本
     */
    showPreview(inputEl, userInput, previewText) {
        if (!inputEl) return;

        const previewSuffix = previewText.startsWith(userInput) 
            ? previewText.substring(userInput.length) 
            : '';

        this.previewState = {
            isActive: true,
            userInput: userInput,
            previewText: previewText,
            targetInput: inputEl,
        };

        // 通过 data-* 属性将预览后缀传递给CSS
        inputEl.dataset.preview = previewSuffix;
        inputEl.classList.add('ddp-preview-active');
        Utils.log(`预览已显示: "${previewSuffix}"`);
    },

    /**
     * 确认预览
     * 将完整的预览文本设置为输入框的值
     */
    confirmPreview() {
        if (!this.previewState.isActive || !this.previewState.targetInput) return;

        const { targetInput, previewText } = this.previewState;
        
        NativeSetter.setValue(targetInput, previewText);
        this.clearPreview();

        // 触发input事件，让斗鱼页面框架能识别到输入变化
        const event = new Event('input', { bubbles: true });
        targetInput.dispatchEvent(event);

        Utils.log(`预览已确认: "${previewText}"`);
    },

    /**
     * 清除/取消预览
     */
    clearPreview() {
        if (!this.previewState.targetInput) return;

        this.previewState.targetInput.classList.remove('ddp-preview-active');
        delete this.previewState.targetInput.dataset.preview;
        
        this.previewState = {
            isActive: false,
            userInput: '',
            previewText: '',
            targetInput: null,
        };
        Utils.log('预览已清除');
    },

    /**
     * 检查预览是否激活
     * @returns {boolean}
     */
    isPreviewActive() {
        return this.previewState.isActive;
    },

    /**
     * 获取用户输入
     * @returns {string}
     */
    getUserInput() {
        return this.previewState.userInput;
    },

    /**
     * 获取完整预览文本
     * @returns {string}
     */
    getPreviewText() {
        return this.previewState.previewText;
    }
};