/**
 * =================================================================================
 * 斗鱼弹幕助手 - 单个候选项组件
 * ---------------------------------------------------------------------------------
 * 创建和管理单个候选项DOM元素
 * =================================================================================
 */

import { CONFIG } from '../utils/CONFIG.js';

/**
 * 候选项组件
 */
export const CandidateItem = {
    
    /**
     * 创建单个候选项元素
     * @param {Object} candidate - 候选项数据
     * @param {number} index - 候选项索引
     * @param {boolean} isActive - 是否为活跃状态
     * @returns {HTMLElement} 候选项DOM元素
     */
    createCandidateItem(candidate, index, isActive = false) {
        const item = document.createElement('div');
        item.className = CONFIG.CSS_CLASSES.POPUP_ITEM;
        item.dataset.index = index;
        
        if (isActive) {
            item.classList.add(CONFIG.CSS_CLASSES.POPUP_ITEM_ACTIVE);
        }
        
        // 创建文本内容
        const textElement = document.createElement('div');
        textElement.className = CONFIG.CSS_CLASSES.POPUP_ITEM_TEXT;
        textElement.textContent = candidate.getDisplayText ? candidate.getDisplayText() : candidate.text;
        
        // 添加元数据（可选）
        if (candidate.useCount > 0) {
            textElement.title = `使用次数: ${candidate.useCount}`;
        }
        
        item.appendChild(textElement);
        
        // 绑定事件
        this.bindItemEvents(item, candidate, index);
        
        return item;
    },
    
    /**
     * 绑定候选项事件
     * @param {HTMLElement} itemEl - 候选项DOM元素
     * @param {Object} candidate - 候选项数据
     * @param {number} index - 候选项索引
     */
    bindItemEvents(itemEl, candidate, index) {
        // 鼠标点击选择
        this.bindItemClick(itemEl, candidate, index);
        
        // 鼠标悬停高亮
        this.bindItemHover(itemEl, index);
    },
    
    /**
     * 绑定鼠标点击事件
     * @param {HTMLElement} itemEl - 候选项DOM元素
     * @param {Object} candidate - 候选项数据
     * @param {number} index - 候选项索引
     */
    bindItemClick(itemEl, candidate, index) {
        itemEl.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            // 触发选择事件
            this._emitSelectEvent(candidate, index, 'click');
        });
    },
    
    /**
     * 绑定鼠标悬停事件
     * @param {HTMLElement} itemEl - 候选项DOM元素
     * @param {number} index - 候选项索引
     */
    bindItemHover(itemEl, index) {
        itemEl.addEventListener('mouseenter', () => {
            // 触发鼠标悬停高亮事件
            this._emitHoverEvent(index);
        });
        
        itemEl.addEventListener('mouseleave', () => {
            // 可选：处理鼠标离开逻辑
        });
    },
    
    /**
     * 更新候选项活跃状态
     * @param {HTMLElement} itemEl - 候选项DOM元素
     * @param {boolean} isActive - 是否为活跃状态
     */
    updateActiveState(itemEl, isActive) {
        if (isActive) {
            itemEl.classList.add(CONFIG.CSS_CLASSES.POPUP_ITEM_ACTIVE);
            
            // 滚动到可见区域
            this._scrollItemIntoView(itemEl);
        } else {
            itemEl.classList.remove(CONFIG.CSS_CLASSES.POPUP_ITEM_ACTIVE);
        }
    },
    
    /**
     * 批量更新候选项列表的活跃状态
     * @param {HTMLElement} container - 容器元素
     * @param {number} activeIndex - 活跃索引
     */
    updateActiveStates(container, activeIndex) {
        const items = container.querySelectorAll(`.${CONFIG.CSS_CLASSES.POPUP_ITEM}`);
        
        items.forEach((item, index) => {
            this.updateActiveState(item, index === activeIndex);
        });
    },
    
    /**
     * 滚动候选项到可见区域
     * @param {HTMLElement} itemEl - 候选项DOM元素
     * @private
     */
    _scrollItemIntoView(itemEl) {
        const container = itemEl.closest(`.${CONFIG.CSS_CLASSES.POPUP_CONTENT}`);
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        const itemRect = itemEl.getBoundingClientRect();
        
        // 检查是否需要滚动
        if (itemRect.top < containerRect.top) {
            // 项目在容器上方，向上滚动
            container.scrollTop += itemRect.top - containerRect.top;
        } else if (itemRect.bottom > containerRect.bottom) {
            // 项目在容器下方，向下滚动
            container.scrollTop += itemRect.bottom - containerRect.bottom;
        }
    },
    
    /**
     * 触发选择事件
     * @param {Object} candidate - 候选项数据
     * @param {number} index - 候选项索引
     * @param {string} trigger - 触发方式
     * @private
     */
    _emitSelectEvent(candidate, index, trigger) {
        const event = new CustomEvent('candidateSelected', {
            detail: { candidate, index, trigger }
        });
        document.dispatchEvent(event);
    },
    
    /**
     * 触发悬停事件
     * @param {number} index - 候选项索引
     * @private
     */
    _emitHoverEvent(index) {
        const event = new CustomEvent('candidateHovered', {
            detail: { index }
        });
        document.dispatchEvent(event);
    },
    
    /**
     * 获取候选项的预期高度
     * @returns {number} 高度像素值
     */
    getItemHeight() {
        return CONFIG.ITEM_HEIGHT;
    }
};