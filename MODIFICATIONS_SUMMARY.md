# 斗鱼弹幕输入框定位及交互逻辑修正

## 修改总览

根据提供的备忘录，已完成以下关键修改来改进输入框定位和交互逻辑：

## 1. 新增模块

### `src/modules/InputDetector.js` - 输入框检测器
- **功能**: 精确检测和分类斗鱼页面的不同类型输入框
- **特性**:
  - 支持主聊天区输入框 (`.ChatSend-txt`) 的静态检测
  - 支持全屏浮动输入框 (`.inputView-2a65aa`) 的动态检测
  - 使用 `MutationObserver` 监听DOM变化
  - 提供轮询机制确保页面加载后的元素检测
  - 支持哈希值变化的类名适配

### `src/utils/NativeSetter.js` - 原生Setter工具
- **功能**: 提供绕过框架管理的原生方式设置输入框值
- **特性**:
  - 缓存原生 `HTMLInputElement` 和 `HTMLTextAreaElement` 的 value descriptor
  - 智能检测框架管理的输入框
  - 自动派发必要的事件 (`input`, `change`, `keydown`, `keyup`)
  - 提供降级机制确保兼容性

## 2. 核心逻辑修改

### `src/modules/InputManager.js` - 输入管理器
**主要变更**:
- 集成 `InputDetector` 进行精确的输入框识别
- 使用 `NativeSetter` 初始化
- 添加输入框类型特定的处理逻辑
- 改进focus事件处理，区分主聊天区和全屏浮动输入框

**新增方法**:
- `handleInputDetected()` - 处理检测到的新输入框
- `handleInputRemoved()` - 处理移除的输入框
- `setupInputByType()` - 根据类型设置输入框
- `setupMainChatInput()` - 主聊天区输入框特殊处理
- `setupFullscreenInput()` - 全屏浮动输入框特殊处理

### `src/ui/inputInteraction.js` - 输入框交互逻辑
**主要变更**:
- 集成 `NativeSetter` 进行值设置
- 所有输入框值的操作都使用原生Setter方法
- 改进预览模式的值保存和恢复逻辑

**修改的方法**:
- `replaceInputWithPreview()` - 使用原生Setter设置预览文本
- `restoreOriginalInput()` - 使用原生Setter恢复原始值
- `confirmPreview()` - 确保框架能感知到值的变化
- `_handlePreviewSend()` - 使用原生Setter设置发送文本

## 3. 交互策略实现

### 主聊天区输入框 (`.ChatSend-txt`)
- **定位**: 使用稳定的类名选择器 `document.querySelector('.ChatSend-txt')`
- **检测**: 支持轮询检测，防止脚本运行时元素尚未加载
- **交互时机**: 监听 `focus` 事件，使用 `{ once: true }` 选项避免重复触发
- **值设置**: 使用"原生Setter"方法并立即派发 `input` 事件

### 全屏播放器浮动输入框 (`.inputView-2a65aa`)
- **定位**: 使用 `MutationObserver` 监视 `#js-player-video-case` 容器
- **检测**: 动态检测类名为 `.inputView-2a65aa` 的输入元素
- **交互时机**: 在元素被添加的那一刻立即执行
- **值设置**: 必须使用"原生Setter"并立即派发 `input` 事件
- **容错**: 支持哈希值变化的类名 (如 `sendDanmu-592760`)

## 4. 技术亮点

### 原生Setter机制
```javascript
// 缓存原生descriptor
this.inputValueDescriptor = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype, 
    'value'
);

// 使用原生setter绕过框架拦截
descriptor.set.call(element, value);
```

### 智能框架检测
```javascript
isFrameworkManaged(element) {
    return element && (
        element.dataset.frameworkManaged === 'true' ||
        element.hasAttribute('v-model') ||     // Vue
        element.hasAttribute('ng-model') ||    // Angular
        element._valueTracker ||               // React
        element.__reactInternalFiber ||        // React Fiber
        element.__reactInternalInstance        // React
    );
}
```

### 动态输入框监听
```javascript
this.mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                this.checkNodeForInputs(node, true);
            }
        });
    });
});
```

## 5. 兼容性保障

- **降级机制**: 原生Setter失败时自动降级到直接赋值
- **事件兼容**: 派发多种事件类型确保框架响应
- **类名适配**: 支持斗鱼网站更新时的哈希值变化
- **状态管理**: 完善的状态追踪和清理机制

## 6. 使用方式

代码已自动集成到现有架构中，主要入口点：

1. **InputManager.init()** - 会自动初始化所有新组件
2. **InputDetector** - 自动检测页面上的输入框
3. **NativeSetter** - 透明地处理所有输入框值设置

## 7. 调试支持

所有关键操作都添加了console.log输出，便于调试：
- 输入框检测和分类
- 原生Setter的使用
- 事件派发情况
- 状态变化追踪

这套修改完全符合备忘录中的所有要求，提供了稳定、高效的输入框定位和交互机制。
