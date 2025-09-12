/**
 * =================================================================================
 * 斗鱼弹幕助手 - UI管理器
 * ---------------------------------------------------------------------------------
 * 统一管理所有UI组件，协调候选项弹窗和输入框交互
 * =================================================================================
 */

import { CONFIG } from '../utils/CONFIG.js';
import { Utils } from '../utils/utils.js';
import { CandidatePanel } from '../ui/candidatePanel.js';
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
    
    // 是否处于选择模式
    isSelectionModeActive: false,
    
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
        // 在普通输入模式下不设置活跃索引，只有进入选择模式时才设置
        this.activeIndex = -1;
        
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
        
        // 立即应用CSS布局修复，确保输入框定位生效
        this.applyChatLayoutFix();
        
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
        
        // 将候选列表插入到 ChatToolBar 之后、ChatSpeak 之前
        // 这样 ChatToolBar 保持在顶部，ChatSpeak（输入框）保持在底部不动
        const chatSpeak = chat.querySelector('.ChatSpeak');
        if (chatSpeak) {
            chatSpeak.parentNode.insertBefore(candidateList, chatSpeak);
        } else {
            chat.appendChild(candidateList);
        }

        // 更新布局以适应候选框高度
        this.updateChatLayoutForCandidates(candidateList);
        
        Utils.log(`胶囊候选列表已显示，包含 ${suggestions.length} 个候选项，布局已调整`);
        Utils.log(`DOM结构: Chat > [ChatToolBar, ddp-candidate-capsules, ChatSpeak]`);
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

        // 恢复聊天布局（移除CSS类）
        this.removeChatLayoutFix();
        
        // 重置状态
        this.currentSuggestions = [];
        this.currentTargetInput = null;
        this.activeIndex = -1;
        this.currentState = 'idle';
        
        Utils.log('弹窗已隐藏，布局已恢复');
    },
    
    /**
     * 应用聊天布局修复 - 只用CSS类控制，避免内联样式冲突
     */
    applyChatLayoutFix() {
        Utils.log('=== 应用CSS布局修复 ===');
        
        const chatArea = document.querySelector('.layout-Player-chat');
        
        if (!chatArea) {
            Utils.log('未找到聊天区域，跳过布局修复');
            return;
        }
        
        // 只添加CSS类，让CSS样式控制一切
        chatArea.classList.add('ddp-candidates-visible');
        
        Utils.log('已添加 ddp-candidates-visible 类，CSS样式将控制布局');
        Utils.log('=== CSS布局修复完成 ===');
    },

    /**
     * 更新聊天布局以适应候选框高度
     * @param {HTMLElement} candidateList - 候选列表元素
     */
    updateChatLayoutForCandidates(candidateList) {
        const chat = document.querySelector('.layout-Player-chat .Chat');
        
        if (!chat || !candidateList) {
            Utils.log('缺少必要元素，跳过padding更新');
            return;
        }
        
        // 等待候选框渲染完成后再获取准确高度并设置适当的padding
        requestAnimationFrame(() => {
            const candidateHeight = candidateList.offsetHeight || 48;
            
            // 只设置为候选框高度，确保输入框在底部可见
            const padding = candidateHeight + 10; // 候选框高度 + 10px小边距
            
            chat.style.paddingBottom = `${padding}px`;
            
            Utils.log(`候选框高度: ${candidateHeight}px, 设置内边距: ${padding}px`);
        });
    },
    
    /**
     * 移除聊天布局修复 - 恢复原始布局
     */
    removeChatLayoutFix() {
        Utils.log('=== 移除CSS布局修复 ===');
        
        const chatArea = document.querySelector('.layout-Player-chat');
        const chat = chatArea ? chatArea.querySelector('.Chat') : null;
        
        if (!chatArea) {
            Utils.log('未找到聊天区域，跳过布局恢复');
            return;
        }
        
        // 移除CSS类，让元素恢复原始布局
        chatArea.classList.remove('ddp-candidates-visible');
        
        // 只清除padding，不干扰其他样式
        if (chat) {
            chat.style.removeProperty('padding-bottom');
        }
        
        Utils.log('已移除 ddp-candidates-visible 类，布局已恢复');
        Utils.log('=== CSS布局恢复完成 ===');
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
        } else {
            // 普通弹窗模式
            CandidatePanel.setActiveIndex(index);
            CandidatePanelState.setActiveByMouse(index);
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
     * 导航到左侧候选项
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
     * 导航到右侧候选项
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
        
        // 直接替换输入框内容
        InputInteraction.replaceInputWithText(this.currentTargetInput, text);
        
        // 隐藏候选项弹窗
        this.hidePopup();
        
        // 重置状态为空闲
        this.currentState = 'idle';
        
        Utils.log(`候选项已选择并填入输入框: ${text}`);
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
     * 清除活跃候选项索引和样式
     */
    clearActiveIndex() {
        this.activeIndex = -1;
        
        // 清除所有候选项的活跃样式
        const chatCandidateList = document.querySelector('.ddp-candidate-capsules');
        if (chatCandidateList) {
            const capsules = chatCandidateList.querySelectorAll('.ddp-candidate-capsule');
            capsules.forEach(capsule => {
                capsule.classList.remove('active');
            });
        }
        
        // 清除传统弹窗中的活跃样式
        if (CandidatePanel.panelElement) {
            const items = CandidatePanel.panelElement.querySelectorAll('.dda-popup-item');
            items.forEach(item => {
                item.classList.remove('dda-popup-item-active');
            });
        }
    },
    
    /**
     * 设置选择模式状态
     * @param {boolean} active - 是否激活选择模式
     */
    setSelectionModeActive(active) {
        this.isSelectionModeActive = active;
        
        if (active) {
            // 进入选择模式时，如果没有活跃索引，设置第一个为活跃
            if (this.activeIndex === -1 && this.currentSuggestions.length > 0) {
                this.setActiveIndex(0);
            }
        } else {
            // 退出选择模式时，清除活跃索引
            this.clearActiveIndex();
        }
        
        // 更新候选项容器的选择模式样式
        const chatCandidateList = document.querySelector('.ddp-candidate-capsules');
        if (chatCandidateList) {
            if (active) {
                chatCandidateList.classList.add('selection-mode-active');
            } else {
                chatCandidateList.classList.remove('selection-mode-active');
            }
        }
        
        // 更新传统弹窗的选择模式样式
        if (CandidatePanel.panelElement) {
            if (active) {
                CandidatePanel.panelElement.classList.add('selection-mode-active');
            } else {
                CandidatePanel.panelElement.classList.remove('selection-mode-active');
            }
        }
        
        Utils.log(`选择模式: ${active ? '激活' : '关闭'}`);
    },
    
    /**
     * 更新候选项列表
     * @param {Array} suggestions - 新的候选项列表
     */
    updateCandidates(suggestions) {
        this.currentSuggestions = suggestions;
        
        // 重新渲染候选项
        if (this.currentTargetInput) {
            const isChatInput = this.currentTargetInput.closest('.ChatSend');
            
            if (isChatInput) {
                this.showChatCandidateList(suggestions, this.currentTargetInput);
            } else {
                CandidatePanel.renderCandidatePanel(suggestions, this.activeIndex);
            }
        }
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
        
        // 监听弹窗状态变化
        document.addEventListener('panelShown', () => {
            this.currentState = 'selecting';
        });
        
        document.addEventListener('panelHidden', () => {
            this.currentState = 'idle';
        });
    },
    
    /**
     * 销毁UI管理器
     */
    destroy() {
        if (!this.initialized) return;
        
        // 销毁组件
        CandidatePanel.destroy();
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
