/**
 * =================================================================================
 * 斗鱼弹幕助手 - UI管理器
 * ---------------------------------------------------------------------------------
 * 统一管理所有UI组件，协调候选项弹窗、预览和输入框交互
 * =================================================================================
 */

import { CONFIG } from '../utils/CONFIG.js';
import { Utils } from '../utils/utils.js';
import { CandidatePanel } from '../ui/candidatePanel.js';
import { InputPreview } from '../ui/inputPreview.js';
import { InputInteraction } from '../ui/inputInteraction.js';
import { CandidatePanelState } from '../ui/candidatePanelState.js';

/**
 * UI管理器
 */
export const UIManager = {
    
    // 初始化状态
    initialized: false,
    
    // 当前状态
    currentState: 'idle',
    
    // 当前目标输入框
    currentTargetInput: null,
    
    // 当前候选项列表
    currentSuggestions: [],
    
    // 当前活跃索引
    activeIndex: 0,
    
    /**
     * 初始化UI管理器
     */
    async init() {
        if (this.initialized) {
            return true;
        }
        
        try {
            // 初始化各个组件
            CandidatePanel.init();
            InputPreview.init();
            InputInteraction.init();
            
            // 绑定组件间的事件通信
            this.bindComponentEvents();
            
            this.initialized = true;
            Utils.log('UIManager initialized successfully');
            return true;
        } catch (error) {
            Utils.log(`UIManager initialization failed: ${error.message}`, 'error');
            return false;
        }
    },
    
    /**
     * 显示候选项弹窗
     * @param {Array} suggestions - 候选项列表
     * @param {HTMLElement} targetInput - 目标输入框
     */
    showPopup(suggestions, targetInput) {
        if (!this.initialized) {
            Utils.log('UIManager not initialized', 'warn');
            return;
        }
        
        this.currentSuggestions = suggestions || [];
        this.currentTargetInput = targetInput;
        this.activeIndex = this.currentSuggestions.length > 0 ? 0 : -1;
        
        if (this.currentSuggestions.length === 0) {
            this.hidePopup();
            return;
        }
        
        // 设置候选项面板状态
        CandidatePanelState.setCandidates(this.currentSuggestions);
        CandidatePanelState.setTargetInput(targetInput);
        CandidatePanelState.resetSelection();
        
        // 渲染候选项弹窗
        CandidatePanel.renderCandidatePanel(this.currentSuggestions, this.activeIndex);
        
        // 显示弹窗
        CandidatePanel.showPanel(targetInput);
        
        // 绑定输入框交互事件
        if (targetInput) {
            InputInteraction.bindInputEvents(targetInput);
        }
        
        this.currentState = 'selecting';
        Utils.log(`Popup shown with ${this.currentSuggestions.length} suggestions`);
    },
    
    /**
     * 隐藏候选项弹窗
     */
    hidePopup() {
        if (!this.initialized) return;
        
        CandidatePanel.hidePanel();
        InputPreview.hidePreview();
        
        // 重置状态
        this.currentSuggestions = [];
        this.currentTargetInput = null;
        this.activeIndex = -1;
        this.currentState = 'idle';
        
        Utils.log('Popup hidden');
    },
    
    /**
     * 设置活跃候选项索引
     * @param {number} index - 新的活跃索引
     */
    setActiveIndex(index) {
        if (!this.initialized || 
            index < 0 || 
            index >= this.currentSuggestions.length) {
            return;
        }
        
        this.activeIndex = index;
        CandidatePanel.setActiveIndex(index);
        CandidatePanelState.setActiveByMouse(index);
        
        // 可选：显示预览
        const activeCandidate = this.currentSuggestions[index];
        if (activeCandidate && this.currentTargetInput) {
            const previewText = activeCandidate.getDisplayText ? 
                activeCandidate.getDisplayText() : activeCandidate.text;
            this.showPreview(previewText);
        }
    },
    
    /**
     * 导航到上一个候选项
     */
    navigateUp() {
        if (!this.initialized || this.currentSuggestions.length === 0) return;
        
        CandidatePanelState.navigateUp();
        const newIndex = CandidatePanelState.activeIndex;
        this.setActiveIndex(newIndex);
    },
    
    /**
     * 导航到下一个候选项
     */
    navigateDown() {
        if (!this.initialized || this.currentSuggestions.length === 0) return;
        
        CandidatePanelState.navigateDown();
        const newIndex = CandidatePanelState.activeIndex;
        this.setActiveIndex(newIndex);
    },
    
    /**
     * 选择当前活跃的候选项
     */
    selectActiveCandidate() {
        if (!this.initialized || 
            this.activeIndex < 0 || 
            this.activeIndex >= this.currentSuggestions.length) {
            return;
        }
        
        const selectedCandidate = this.currentSuggestions[this.activeIndex];
        this.selectCandidate(selectedCandidate);
    },
    
    /**
     * 选择指定的候选项
     * @param {Object} candidate - 要选择的候选项
     */
    selectCandidate(candidate) {
        if (!candidate || !this.currentTargetInput) return;
        
        const text = candidate.getDisplayText ? 
            candidate.getDisplayText() : candidate.text;
            
        // 更新使用统计
        if (typeof candidate.updateUsage === 'function') {
            candidate.updateUsage();
        }
        
        // 替换输入框内容
        InputInteraction.replaceInputWithPreview(this.currentTargetInput, text);
        
        // 显示预览
        this.showPreview(text);
        
        // 隐藏候选项弹窗
        this.hidePopup();
        
        Utils.log(`Candidate selected: ${text}`);
    },
    
    /**
     * 显示输入预览
     * @param {string} previewText - 预览文本
     */
    showPreview(previewText) {
        if (!this.initialized || !previewText || !this.currentTargetInput) return;
        
        InputPreview.renderInputPreview(previewText, this.currentTargetInput);
    },
    
    /**
     * 隐藏输入预览
     */
    hidePreview() {
        if (!this.initialized) return;
        
        InputPreview.hidePreview();
    },
    
    /**
     * 检查弹窗是否可见
     * @returns {boolean} 是否可见
     */
    isPopupVisible() {
        return this.initialized && CandidatePanel.isVisible();
    },
    
    /**
     * 检查预览是否可见
     * @returns {boolean} 是否可见
     */
    isPreviewVisible() {
        return this.initialized && InputPreview.isVisible();
    },
    
    /**
     * 获取当前状态
     * @returns {string} 当前状态
     */
    getCurrentState() {
        return this.currentState;
    },
    
    /**
     * 绑定组件间事件通信
     */
    bindComponentEvents() {
        // 监听候选项选择事件
        document.addEventListener('candidateSelected', (event) => {
            const { candidate } = event.detail;
            this.selectCandidate(candidate);
        });
        
        // 监听候选项悬停事件
        document.addEventListener('candidateHovered', (event) => {
            const { index } = event.detail;
            this.setActiveIndex(index);
        });
        
        // 监听输入框焦点事件
        document.addEventListener('inputFocused', (event) => {
            const { inputEl } = event.detail;
            this.currentTargetInput = inputEl;
        });
        
        // 监听输入框失焦事件
        document.addEventListener('inputBlurred', (event) => {
            // 延迟隐藏，给候选项操作一些时间
            setTimeout(() => {
                if (!CandidatePanel.isVisible()) {
                    this.hidePopup();
                }
            }, 150);
        });
        
        // 监听预览发送事件
        document.addEventListener('previewSend', (event) => {
            const { text, targetInput } = event.detail;
            this.handlePreviewSend(text, targetInput);
        });
        
        // 监听弹窗状态变化
        document.addEventListener('panelShown', () => {
            this.currentState = 'selecting';
        });
        
        document.addEventListener('panelHidden', () => {
            this.currentState = 'idle';
        });
    },
    
    /**
     * 处理预览发送
     * @param {string} text - 发送的文本
     * @param {HTMLElement} targetInput - 目标输入框
     */
    handlePreviewSend(text, targetInput) {
        // 确认预览内容
        if (targetInput) {
            InputInteraction.confirmPreview(targetInput);
        }
        
        // 隐藏UI
        this.hidePopup();
        this.hidePreview();
        
        Utils.log(`Text sent: ${text}`);
    },
    
    /**
     * 销毁UI管理器
     */
    destroy() {
        if (!this.initialized) return;
        
        // 销毁组件
        CandidatePanel.destroy();
        InputPreview.destroy();
        InputInteraction.cleanup();
        
        // 重置状态
        this.initialized = false;
        this.currentState = 'idle';
        this.currentTargetInput = null;
        this.currentSuggestions = [];
        this.activeIndex = 0;
        
        Utils.log('UIManager destroyed');
    }
};
