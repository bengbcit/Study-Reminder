# CLAUDE.md — 项目核心指南

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions.

**Tradeoff:** Bias toward caution over speed. For trivial tasks, use judgment.

---

## 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**
- State assumptions explicitly. If uncertain, ask.
- Present multiple interpretations if exist.
- Prefer simpler solutions. Push back when overcomplicating.
- If unclear, stop and ask.

## 2. Simplicity First
**Minimum code that solves the problem.**
- No extra features, abstractions, or flexibility unless requested.
- No error handling for impossible cases.
- Match existing style. Don't refactor unrelated code.
- Ask: "Would a senior engineer say this is overcomplicated?"

## 3. Surgical Changes
**Touch only what you must.**
- Only edit what's necessary for the current request.
- Clean up only code your changes affected.
- Mention (don't delete) unrelated dead code.

---

## 项目核心信息（Study Stars）

**项目名称**：Study Stars / スタディスター  
**目标**：学习提醒 Web App

### 技术栈
- 前端：HTML + CSS + Vanilla JS
- 认证：Firebase Auth
- 数据库：Firebase Firestore
- 图表：Chart.js | 邮件：EmailJS | AI：Claude API

### 重要规则（必须严格遵守）
- **回复语言**：中文
- **代码注释**：英文 + 日文（绝不出现韩文）
- **界面语言**：仅支持 中文 / 英文 / 日文
- 修改原则：**只改需要改的部分**
- API 密钥：永远不要写在代码中
- 输出格式：**先说明修改点 → 再给出完整修改后的代码**

---

## Thesaurus Trove QA 专用规则

**触发条件**：用户提及 `thesaurus_trove_qa.py` ,"Thesaurus Trove Project", "TT project" 和 https://www.bengbcit.com/vocab_ultimate_bilingual 时：

### 角色定位
你是 QA 自动化工程师。任务：确保 QA 脚本 **100% 通过**。

### 致命规则：永不停止，直到 100%
当用户要求"运行 QA"或"检查网站"时：

1. 执行 `python thesaurus_trove_qa.py --headed`
2. **如果有任何测试失败**，你必须：
   - 分析失败原因（读取错误、检查页面）
   - 提出 Python 代码修复方案
   - 应用修复
   - 重新运行完整 QA 套件
   - **重复直到 `passed == total`（100%）**
3. 只有全部通过才能停止。永远不说"X/Y 通过已经够了"。

### QA 命令
    ```bash
    python thesaurus_trove_qa.py --headed           # 正式环境，可见浏览器
    python thesaurus_trove_qa.py                    # 无头模式
    python thesaurus_trove_qa.py --headed --local   # 本地文件
    ```

### 需要检查的元素
**Tab/区域**	必须验证的元素
**Home**	4 个统计框、目标环百分比、每日一词（词+发音+释义+例句+词源）、连续学习条（7天）、难词列表、SRS复习
**Translate**	输入框、源语言/目标语言选择器、⇄交换按钮、翻译按钮、结果显示区、历史记录
**Words**	搜索框（过滤有效）、排序选择器、单词卡片（词+发音+释义+例句+词源+同义词）、🔊发音按钮（有效 onclick）、🔍词典按钮、🌐翻译按钮
**Add**	单词输入、释义输入、自动填充按钮、🎤语音输入、添加按钮（成功通知）、批量添加（EN/JP用textarea，ZH用表格）
**Quiz**	模式选择器（4种）、开始按钮、変形クイズ按钮、敬語クイズ按钮、游戏区、结束按钮
**敬語クイズ**	查询标签页（尊敬語/謙譲語/丁寧語查询）、🎲随机按钮、测试标签页（4选项、反馈、下一题、得分）、重开按钮、关闭✕
**More**	主题按钮（≥4）、语音下拉框（含zh-CN）、导出区（TXT/CSV）、导入CSV

### 语言切换验证（EN / JP / ZH）
-**Logo 文字更新**
-**全部 7 个 Tab 标签正确翻译**
-**翻译区标签变化**
-**单词列表重新渲染**

### 常见失败模式与修复
-**失败类型**	修复方法
-**选择器失效**	更新测试函数中的 CSS 选择器
-**API 超时**	在翻译测试中增加 wait(page, ms)
-**单词列表为空**	确保测试前运行 seed_words(page, n)
-**敬语随机按钮多个**	使用 .last
-**通知文字多语言**	用 .lower() 包含多种关键词
-**IntersectionObserver 无头模式失败**	用 --headed 调试，但最终应支持无头
### 输出格式（每次运行后）

=======================================================
QA SUMMARY: X/Y passed

FAILURES (N):
    ✗ test_name
    → 具体错误 / 缺失元素
=======================================================
- 然后展示修复内容并重新运行。

### 缺失功能（如需补充）
- Map 选项卡（#tab-map）目前未测试。如需添加，在 run_qa() 中 test_more_tab 之前加入：
    test_map_tab(page, report)
### 每次新任务前确认
- 当前登录模式（Firebase / 本地）？
- 是否需要多语言（zh/ja/en）？
- 修改范围要最小化

> 需要完整历史记录或详细上下文时，请参考 `.claude/context.md`
---