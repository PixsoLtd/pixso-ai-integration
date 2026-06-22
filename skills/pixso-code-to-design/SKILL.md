---
id: pixso-code-to-design
original: ../skills/pixso-code-to-design.md
references:
  - ./references/url-capture.md
title: Pixso 代码转设计
description: "当用户要求把网页 URL、HTML、ZIP、静态 Web 产物或浏览器渲染页面导入/转换到 Pixso 时，必须先使用本技能，再调用 Pixso MCP `code_to_design`。触发词包括：网页转 Pixso、URL/HTML/ZIP 转 Pixso、code_to_design、导入网页到 Pixso。URL 输入必须先本地渲染/捕获并打包成真实 `htmlBuffer`；禁止直接传 URL，禁止未经确认改用近似重建。"
language: zh-CN
---

# Pixso 代码转设计 - 将 HTML、URL 或打包 UI 导入 Pixso

当用户希望将 HTML、网页 URL、ZIP 包、静态 Web 产物或浏览器渲染页面导入、粘贴、捕获、推送或转换为可编辑 Pixso 设计节点时，使用本技能。

## 首行动作门禁

调用 Pixso MCP 工具前，先确认最终输入已准备好：原始/自包含 HTML 用 `htmlStr`，URL 或带资源页面默认用真实 ZIP 字节 `htmlBuffer`。输入是 URL 时，必须先阅读并遵循 [references/url-capture.md](references/url-capture.md)。

如遇登录、权限、地区、反爬、安全策略、iframe、hash 路由、资源缺失或目标内容不可见，先报告阻塞点并询问下一步。未经用户确认，不要把捕获失败降级为 `pixso-design` / `apply_design` / 手写 HTML / 近似重建。

## 生效门禁

仅在用户明确要求 HTML / URL / ZIP / 静态 Web 产物转 Pixso，或明确要求 `code_to_design` 时使用本技能。

兜底例外：

- 用户要求创建或编辑 Pixso 设计，但没有要求 HTML 转换时，优先使用 `pixso-design-editing`。
- 只有当前 Pixso MCP 工具列表中没有 `apply_design` 时，才自动改用本技能，通过 `code_to_design` 作为兜底路径。
- 使用兜底路径时，必须说明 `apply_design` 不可用，因此改用 HTML-to-design 转换。

当 `apply_design` 可用时，不要将本技能用于通用 Pixso 设计创建、UI mockup、重新设计、首页生成、App 页面生成或画布编辑。

## 技能边界

处理原始 HTML、自包含 HTML、可捕获 URL、静态导出、ZIP 包，以及 `code_to_design` 后的定向修复。不要把 URL 直接传给 `code_to_design`。

## 输入规则

- `htmlStr` 和 `htmlBuffer` 二选一，不能同时提供。
- URL 输入先本地渲染/捕获；不要假设 Pixso 能抓取 URL、认证或下载运行时资源。
- URL 页面默认按 [references/url-capture.md](references/url-capture.md) 生成 ZIP 并通过 `htmlBuffer` 传入。
- 只有捕获结果已自包含，或有意省略外部资源且已说明时，才对 URL 页面使用 `htmlStr`。

## URL 输入规则

处理 URL 输入时，先阅读 [references/url-capture.md](references/url-capture.md)。默认优先使用浏览器“完整网页保存”产物；只有保存不可用或明显不完整时，才按 reference 做 DOM / CSS 感知的视觉资源收集。

## 不可降级门禁

- “网页 / URL / HTML / ZIP 转 Pixso”或明确 `code_to_design` 表示精确捕获和转换，不是参考式结构重建。
- URL 难抓取、登录、权限、错误、空状态、hash 路由、iframe、反爬、安全策略或资源缺失时，视为阻塞或输入不完整。
- `code_to_design` 失败、误传输入或结果不匹配时，只报告失败点和可选下一步；未经确认，不要改用其他工具或近似重建。
- 不要传入占位 HTML、临时 stub、摘要、路径、空 body、`PLACEHOLDER` 或 `TODO`。

## 必须流程

1. **确认来源产物。** 判断来源是原始 HTML、URL、静态导出还是 ZIP 包。
2. **准备正确输入。** 原始/自包含 HTML 使用 `htmlStr`，ZIP 字节使用 `htmlBuffer`。
3. **URL 输入先按参考捕获并打包。** 阅读并遵循 [references/url-capture.md](references/url-capture.md)，优先使用浏览器完整保存产物创建 `htmlBuffer` ZIP，除非捕获结果已完全自包含。
4. **调用 `code_to_design`。** 将最终产物转换为 Pixso 节点。
5. **报告结果。** 说明转换来源；如果是 URL，说明资源如何捕获或打包；说明检查内容、验证结果和剩余差异。

## 视觉标准

`code_to_design` 调用成功即可完成，但不要声称“视觉完全一致”，除非实际做过截图或结构验证。

## 完成检查清单

最终回复前确认：

- 只使用了一种输入类型；
- 传给 `code_to_design` 的是最终 `htmlStr` 或真实 `htmlBuffer`，不是占位符、变量名、路径或临时 stub；
- 如有 URL 输入，已阅读并遵循 [references/url-capture.md](references/url-capture.md)；
- 所需 URL 资源已打包、内联，或明确报告不可用；
- 未引入用户未要求的重设计；
- `code_to_design` 失败或结果不匹配时，未在用户确认前改用 `pixso-design` / `apply_design`；
- 如果请求了设计系统对齐，已路由到 `pixso-design-system`。
