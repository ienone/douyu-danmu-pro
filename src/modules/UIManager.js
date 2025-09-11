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
import { EnhancedInputPreview } from '../ui/enhancedInputPreview.js';
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
            Utils.log('UI管理器初始化成功');
            return true;
        } catch (error) {
            Utils.log(`UI管理器初始化失败: ${error.message}`, 'error');
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
            Utils.log('UIManager未初始化', 'warn');
            return;
        }
        
        this.currentSuggestions = suggestions || [];
        this.currentTargetInput = targetInput;
        this.activeIndex = this.currentSuggestions.length > 0 ? 0 : -1;
        
        if (this.currentSuggestions.length === 0) {
            this.hidePopup();
            return;
        }
        
        // 立即设置状态为 showing，避免竞态条件
        this.currentState = 'showing';
        
        // 设置候选项面板状态
        CandidatePanelState.setCandidates(this.currentSuggestions);
        CandidatePanelState.setTargetInput(targetInput);
        CandidatePanelState.resetSelection();
        
        // 检查是否为聊天输入框，使用不同的显示方式
        const isChatInput = targetInput && targetInput.closest('.ChatSend');
        
        if (isChatInput) {
            // 为聊天输入框显示横向胶囊候选列表
            this.showChatCandidateList(this.currentSuggestions, targetInput);
        } else {
            // 渲染候选项弹窗
            CandidatePanel.renderCandidatePanel(this.currentSuggestions, this.activeIndex);
            // 显示弹窗
            CandidatePanel.showPanel(targetInput);
        }
        
        // 绑定输入框交互事件
        if (targetInput) {
            InputInteraction.bindInputEvents(targetInput);
        }
        
        // 延迟设置为 selecting 状态，确保弹窗完全显示
        setTimeout(() => {
            if (this.currentState === 'showing') {
                this.currentState = 'selecting';
            }
        }, 100);
        
        Utils.log(`弹窗已显示，包含 ${this.currentSuggestions.length} 个候选项`);
    },
    
    /**
     * 为聊天输入框显示横向胶囊候选列表
     * @param {Array} suggestions - 候选项列表
     * @param {HTMLElement} targetInput - 目标输入框
     */
    showChatCandidateList(suggestions, targetInput) {
        // 查找 Chat 容器（正确的父级容器）
        const chat = document.querySelector('.layout-Player-chat .Chat');
        if (!chat) {
            Utils.log('未找到 Chat 容器，回退到普通弹窗模式');
            CandidatePanel.renderCandidatePanel(suggestions, this.activeIndex);
            CandidatePanel.showPanel(targetInput);
            return;
        }
        
        // 移除可能存在的旧候选列表
        const existingList = document.querySelector('.ddp-candidate-capsules');
        if (existingList) {
            existingList.remove();
        }
        
        // 创建候选列表容器
        const candidateList = document.createElement('div');
        candidateList.className = 'ddp-candidate-capsules';
        
        // 添加候选项胶囊
        suggestions.forEach((suggestion, index) => {
            const capsule = document.createElement('div');
            capsule.className = `ddp-candidate-capsule ${index === this.activeIndex ? 'active' : ''}`;
            capsule.dataset.index = index;
            
            const text = suggestion.getDisplayText ? suggestion.getDisplayText() : suggestion.text;
            capsule.textContent = text;
            
            // 添加点击事件
            capsule.addEventListener('click', () => {
                this.selectCandidate(suggestion);
            });
            
            candidateList.appendChild(capsule);
        });
        
        // 将候选列表作为 Chat 的直接子级插入，与 ChatSpeak 和 ChatToolBar 同级
        // 查找 ChatSpeak 元素，将候选列表插入到它之后
        const chatToolBar = chat.querySelector('.ChatToolBar');
        if (chatToolBar) {
            chatToolBar.parentNode.insertBefore(candidateList, chatToolBar.nextSibling);
        } else {
            chat.appendChild(candidateList);
        }

        // 计算并调整聊天区域高度
        this.adjustChatLayoutForCandidates(candidateList, targetInput);
        
        // 更新输入框预览
        this.updateChatInputPreview(targetInput);
        
        Utils.log(`胶囊候选列表已显示，包含 ${suggestions.length} 个候选项，布局已调整`);
        Utils.log(`DOM结构: Chat > [ChatSpeak, ddp-candidate-capsules, ChatToolBar]`);
    },
    
    /**
     * 隐藏候选项弹窗
     */
    hidePopup() {
        if (!this.initialized) return;
        
        // 强制显示调用栈追踪
        console.log('=== HIDEOPOPUP 被调用 ===');
        console.log(`当前状态: ${this.currentState}`);
        console.log('完整调用栈:');
        console.trace('hidePopup调用追踪');
        
        Utils.log(`隐藏弹窗，当前状态: ${this.currentState}`);
        
        CandidatePanel.hidePanel();
        
        // 清理聊天胶囊列表和布局恢复
        const existingList = document.querySelector('.ddp-candidate-capsules');
        if (existingList) {
            existingList.remove();
        }

        // [精确布局恢复] 恢复原始聊天区域高度
        this.restoreChatLayoutAfterCandidates();
        
        // 清除预览状态
        if (this.currentTargetInput) {
            EnhancedInputPreview.clearPreview();
        }
        
        // 重置状态
        this.currentSuggestions = [];
        this.currentTargetInput = null;
        this.activeIndex = -1;
        this.currentState = 'idle';
        
        Utils.log('弹窗已隐藏，布局已恢复');
    },
    
    /**
     * 为候选项调整聊天布局
     * @param {HTMLElement} candidateList - 候选列表元素
     * @param {HTMLElement} targetInput - 目标输入框
     */
    adjustChatLayoutForCandidates(candidateList, targetInput) {
        Utils.log('=== 开始调整聊天布局 ===');
        
        const chatArea = document.querySelector('.layout-Player-chat');
        const chat = chatArea ? chatArea.querySelector('.Chat') : null;
        
        if (!chat || !chatArea) {
            Utils.log('未找到Chat或layout-Player-chat元素，跳过布局调整');
            return;
        }
        
        // 完全清除可能存在的内联样式，防止CSS残留问题
        chat.style.removeProperty('height');
        chat.style.removeProperty('max-height');
        chat.style.removeProperty('min-height');
        chat.style.removeProperty('transition');
        chatArea.style.removeProperty('height');
        chatArea.style.removeProperty('max-height');
        chatArea.style.removeProperty('min-height');
        chatArea.style.removeProperty('transition');
        chatArea.style.removeProperty('margin-top');
        
        // 等待两帧让浏览器完全重新计算布局
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // 获取候选列表的实际高度
                let candidateHeight = candidateList.offsetHeight;
                if (candidateHeight === 0) {
                    candidateHeight = 48; // 单行候选列表的固定高度
                }
                Utils.log(`候选列表高度: ${candidateHeight}px`);
                
                // 获取清除样式后的原始高度
                const originalChatHeight = chat.offsetHeight;
                const originalChatAreaHeight = chatArea.offsetHeight;
                
                Utils.log(`原始Chat高度: ${originalChatHeight}px`);
                Utils.log(`原始ChatArea高度: ${originalChatAreaHeight}px`);
                
                // 保存原始高度到元素的dataset中
                candidateList.dataset.originalChatHeight = originalChatHeight + 'px';
                candidateList.dataset.originalChatAreaHeight = originalChatAreaHeight + 'px';
                
                // 简单的高度调整：只增加候选列表的高度
                chat.style.height = (originalChatHeight + candidateHeight) + 'px';
                chatArea.style.height = (originalChatAreaHeight + candidateHeight) + 'px';
                
                // 添加平滑过渡
                chat.style.transition = 'height 0.3s ease';
                chatArea.style.transition = 'height 0.3s ease';
                
                Utils.log(`应用后Chat高度: ${chat.style.height}`);
                Utils.log(`应用后ChatArea高度: ${chatArea.style.height}`);
                Utils.log('=== 布局调整完成 ===');
            });
        });
    },
    
    /**
     * 恢复候选项后的聊天布局
     */
    restoreChatLayoutAfterCandidates() {
        Utils.log('=== 开始恢复聊天布局 ===');
        
        const chatArea = document.querySelector('.layout-Player-chat');
        const chat = chatArea ? chatArea.querySelector('.Chat') : null;
        
        if (!chat || !chatArea) {
            Utils.log('未找到Chat或layout-Player-chat元素，跳过布局恢复');
            return;
        }
        
        // 查找是否有保存的原始高度
        const candidateList = document.querySelector('.ddp-candidate-capsules');
        const originalChatHeight = candidateList ? candidateList.dataset.originalChatHeight : null;
        const originalChatAreaHeight = candidateList ? candidateList.dataset.originalChatAreaHeight : null;
        
        Utils.log(`要恢复的Chat高度: ${originalChatHeight}`);
        Utils.log(`要恢复的ChatArea高度: ${originalChatAreaHeight}`);
        
        // 直接移除所有内联样式，让CSS规则接管
        // 这样可以避免任何可能的CSS残留问题
        chat.style.removeProperty('height');
        chat.style.removeProperty('transition');
        chatArea.style.removeProperty('height');  
        chatArea.style.removeProperty('transition');
        
        // 如果有保存的原始高度，使用它们（但通过removeProperty后再设置）
        if (originalChatHeight && originalChatAreaHeight) {
            // 等待一帧让浏览器应用removeProperty的效果
            requestAnimationFrame(() => {
                chat.style.height = originalChatHeight;
                chatArea.style.height = originalChatAreaHeight;
                chat.style.transition = 'height 0.3s ease';
                chatArea.style.transition = 'height 0.3s ease';
                
                Utils.log(`重新应用Chat高度: ${originalChatHeight}`);
                Utils.log(`重新应用ChatArea高度: ${originalChatAreaHeight}`);
            });
        }
        
        Utils.log(`恢复后Chat样式高度: ${chat.style.height}`);
        Utils.log(`恢复后ChatArea样式高度: ${chatArea.style.height}`);
        
        // 验证恢复结果
        setTimeout(() => {
            Utils.log(`验证恢复 - Chat最终offsetHeight: ${chat.offsetHeight}px`);
            Utils.log(`验证恢复 - ChatArea最终offsetHeight: ${chatArea.offsetHeight}px`);
            Utils.log('=== 聊天布局恢复完成 ===');
        }, 350); // 等待动画完成
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
        
        const oldIndex = this.activeIndex;
        this.activeIndex = index;
        
        // 检查是否为聊天输入框模式
        const isChatInput = this.currentTargetInput && this.currentTargetInput.closest('.ChatSend');
        
        if (isChatInput) {
            // 更新胶囊样式
            this.updateChatCandidateStyles(oldIndex, index);
            // 更新输入框预览
            this.updateChatInputPreview(this.currentTargetInput);
        } else {
            // 普通弹窗模式
            CandidatePanel.setActiveIndex(index);
            CandidatePanelState.setActiveByMouse(index);
            
            // 显示预览
            const activeCandidate = this.currentSuggestions[index];
            if (activeCandidate && this.currentTargetInput) {
                const previewText = activeCandidate.getDisplayText ? 
                    activeCandidate.getDisplayText() : activeCandidate.text;
                this.showPreview(previewText);
            }
        }
    },
    
    /**
     * 更新聊天候选胶囊样式
     * @param {number} oldIndex - 旧的活跃索引
     * @param {number} newIndex - 新的活跃索引
     */
    updateChatCandidateStyles(oldIndex, newIndex) {
        const candidateList = document.querySelector('.ddp-candidate-capsules');
        if (!candidateList) return;
        
        // 重置旧的活跃项
        if (oldIndex >= 0) {
            const oldCapsule = candidateList.querySelector(`[data-index="${oldIndex}"]`);
            if (oldCapsule) {
                oldCapsule.classList.remove('active');
            }
        }
        
        // 设置新的活跃项
        const newCapsule = candidateList.querySelector(`[data-index="${newIndex}"]`);
        if (newCapsule) {
            newCapsule.classList.add('active');
            
            // 滚动到可见区域
            newCapsule.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest', 
                inline: 'center' 
            });
        }
    },
    
    /**
     * 更新聊天输入框预览
     * @param {HTMLElement} targetInput - 目标输入框
     */
    updateChatInputPreview(targetInput) {
        if (!targetInput || this.activeIndex < 0 || this.activeIndex >= this.currentSuggestions.length) {
            EnhancedInputPreview.clearPreview();
            return;
        }
        
        const candidate = this.currentSuggestions[this.activeIndex];
        const previewText = candidate.getDisplayText ? 
            candidate.getDisplayText() : candidate.text;
        
        // 获取用户当前输入 (注意：现在直接从输入框获取)
        const userInput = targetInput.value;
        
        // 显示增强预览
        EnhancedInputPreview.showPreview(targetInput, userInput, previewText);
    },
    
    /**
     * 导航到上一个候选项
     */
    navigateUp() {
        if (!this.initialized || this.currentSuggestions.length === 0) return;
        
        // 检查是否为聊天输入框模式
        const isChatInput = this.currentTargetInput && this.currentTargetInput.closest('.ChatSend');
        
        if (isChatInput) {
            // 对于聊天输入框，上键相当于左键
            this.navigateLeft();
        } else {
            CandidatePanelState.navigateUp();
            const newIndex = CandidatePanelState.activeIndex;
            this.setActiveIndex(newIndex);
        }
    },
    
    /**
     * 导航到下一个候选项
     */
    navigateDown() {
        if (!this.initialized || this.currentSuggestions.length === 0) return;
        
        // 检查是否为聊天输入框模式
        const isChatInput = this.currentTargetInput && this.currentTargetInput.closest('.ChatSend');
        
        if (isChatInput) {
            // 对于聊天输入框，下键相当于右键
            this.navigateRight();
        } else {
            CandidatePanelState.navigateDown();
            const newIndex = CandidatePanelState.activeIndex;
            this.setActiveIndex(newIndex);
        }
    },
    
    /**
     * 导航到左侧候选项（用于聊天胶囊模式）
     */
    navigateLeft() {
        if (!this.initialized || this.currentSuggestions.length === 0) return;
        
        let newIndex = this.activeIndex - 1;
        if (newIndex < 0) {
            newIndex = this.currentSuggestions.length - 1; // 循环到最后一个
        }
        this.setActiveIndex(newIndex);
    },
    
    /**
     * 导航到右侧候选项（用于聊天胶囊模式）
     */
    navigateRight() {
        if (!this.initialized || this.currentSuggestions.length === 0) return;
        
        let newIndex = this.activeIndex + 1;
        if (newIndex >= this.currentSuggestions.length) {
            newIndex = 0; // 循环到第一个
        }
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
        
        Utils.log(`候选项已选择: ${text}`);
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
        // 检查胶囊列表是否可见
        const chatCandidateList = document.querySelector('.ddp-candidate-capsules');
        if (chatCandidateList && chatCandidateList.style.display !== 'none') {
            return true;
        }
        
        // 检查传统弹窗是否可见
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
        // 全局监控所有失焦事件
        document.addEventListener('blur', (event) => {
            if (event.target && event.target.matches && event.target.matches('input, textarea')) {
                console.log('🔍 全局检测到输入框失焦:', event.target.className, 'value:', event.target.value);
            }
        }, true);
        
        // 全局监控所有自定义事件
        const originalDispatchEvent = document.dispatchEvent;
        document.dispatchEvent = function(event) {
            if (event.type.includes('input') || event.type.includes('blur') || event.type.includes('focus')) {
                console.log('🎯 自定义事件被触发:', event.type, event.detail);
            }
            return originalDispatchEvent.call(this, event);
        };
        
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
        
        // 监听输入框失焦事件 - 完全禁用隐藏逻辑以测试
        document.addEventListener('inputBlurred', (event) => {
            Utils.log('=== 输入框失焦事件触发（已完全禁用隐藏逻辑） ===');
            // 完全禁用隐藏逻辑，看看是否还有其他地方调用 hidePopup
            return;
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
        // 如果是增强预览状态，确认预览
        if (EnhancedInputPreview.isPreviewActive()) {
            EnhancedInputPreview.confirmPreview(targetInput);
        } else if (targetInput) {
            // 传统预览确认
            InputInteraction.confirmPreview(targetInput);
        }
        
        // 隐藏UI
        this.hidePopup();
        this.hidePreview();
        
        Utils.log(`文本已发送: ${text}`);
    },
    
    /**
     * 销毁UI管理器
     */
    destroy() {
        if (!this.initialized) return;
        
        // 销毁组件
        CandidatePanel.destroy();
        InputPreview.destroy();
        EnhancedInputPreview.destroy(); // 销毁增强预览组件
        InputInteraction.cleanup();
        
        // 重置状态
        this.initialized = false;
        this.currentState = 'idle';
        this.currentTargetInput = null;
        this.currentSuggestions = [];
        this.activeIndex = 0;
        
        Utils.log('UI管理器已销毁');
    },
    
    /**
     * 计算候选列表高度
     * @param {Array} suggestions - 候选项列表
     * @returns {number} 计算出的高度
     */
    calculateCandidateListHeight(suggestions) {
        // 基础高度：容器padding + margin
        const baseHeight = 12; // 上下padding/margin
        
        // 单个胶囊高度（包括margin）
        const capsuleHeight = 32; // 高度 + margin
        
        // 计算行数（假设每行最多显示的胶囊数）
        const maxCapsulesPerRow = Math.floor(window.innerWidth * 0.6 / 120); // 每个胶囊约120px宽
        const rows = Math.ceil(suggestions.length / maxCapsulesPerRow);
        
        const calculatedHeight = baseHeight + (rows * capsuleHeight);
        
        Utils.log(`计算候选列表高度:`);
        Utils.log(`- 建议数量: ${suggestions.length}`);
        Utils.log(`- 窗口宽度: ${window.innerWidth}px`);
        Utils.log(`- 每行最大胶囊数: ${maxCapsulesPerRow}`);
        Utils.log(`- 计算行数: ${rows}`);
        Utils.log(`- 基础高度: ${baseHeight}px`);
        Utils.log(`- 胶囊高度: ${capsuleHeight}px`);
        Utils.log(`- 计算总高度: ${calculatedHeight}px`);
        
        return calculatedHeight;
    },
};
