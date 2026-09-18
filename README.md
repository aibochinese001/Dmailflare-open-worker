# Mailflare（Dmailflare）

## 开源企业域名邮箱系统

Mailflare（Dmailflare）是一套开源的企业域名邮箱系统，基于 **Next.js、Cloudflare Workers、D1、R2 和 Queues** 构建。无需购买或维护传统服务器，即可将系统无服务器部署在 Cloudflare Workers 上，搭建属于自己的企业域名邮箱。

项目适合企业、团队、个人品牌以及需要管理多个自定义域名邮箱的用户使用。邮箱数据存储在您自己的 Cloudflare 账户中，兼顾灵活性、可扩展性与数据自主权。

## 部署教程

完整部署教程请参考：

[Cloudflare Workers 无服务器部署企业域名邮箱教程](https://opcgrow.org/article.php?id=154)

也可以使用 Cloudflare 一键部署：

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/aibochinese001/Dmailflare-open-worker)

## 项目功能

- **自定义域名邮箱**：连接托管在 Cloudflare 的域名，创建企业邮箱和团队邮箱。
- **收发邮件**：支持邮件接收、发送、回复、转发及抄送、密送。
- **富文本编辑**：支持 HTML 富文本邮件、纯文本内容、签名和自动回复。
- **附件管理**：支持邮件附件上传、下载，以及转发邮件时复制原邮件附件。
- **邮件整理**：支持搜索、文件夹、自定义分类、星标、归档、延后处理、垃圾邮件和回收站。
- **邮件线程**：自动识别回复关系，将同一对话中的邮件归纳为会话，方便连续阅读和管理。
- **收件规则**：支持按域名、邮箱地址或发件人设置存储、转发、拒收和分类规则。
- **联系人管理**：自动整理联系人，并支持手动管理联系人信息。
- **实时通知**：通过 Durable Objects 提供实时收件箱更新和新邮件通知。
- **多账户与权限**：支持个人邮箱、共享邮箱、委派访问和账户权限管理。
- **Webhook 与 API**：支持 API 密钥、Webhook、审计日志，便于对接企业内部系统和自动化流程。
- **数据备份**：支持数据库及邮件数据备份，数据保存在您自己的 Cloudflare D1 和 R2 资源中。
- **无服务器架构**：基于 Cloudflare Workers 运行，不需要维护虚拟机、传统服务器或邮件服务器。

## 技术架构

- **运行平台**：Cloudflare Workers + OpenNext
- **前端框架**：Next.js App Router
- **数据库**：Cloudflare D1 + Drizzle ORM
- **文件与附件存储**：Cloudflare R2
- **异步任务**：Cloudflare Queues
- **实时通信**：Cloudflare Durable Objects + WebSocket
- **邮件接收**：Cloudflare Email Routing
- **定时任务**：Cloudflare Cron Triggers

邮件接收后会先保存原始 MIME 数据，再通过队列异步解析和处理，降低请求延迟并提升系统稳定性。邮件发送则使用 Cloudflare 的邮件发送能力，适合在 Cloudflare 生态内统一部署和管理。

## 适配 mailsorta.opcgrow.org 邮情 AI 分拣助手

Mailflare 可以与 [mailsorta.opcgrow.org](https://mailsorta.opcgrow.org) 邮情 AI 分拣助手进行适配，为企业邮箱增加智能邮件分析和自动分拣能力。

通过对接 Mailflare 的 API、Webhook 或邮件处理流程，邮件到达后可以交给邮件 AI 助手进行识别和分类，例如：

- 判断邮件主题和内容，识别客户咨询、订单、售后、合作、通知等类型。
- 自动识别重要邮件、紧急邮件、垃圾邮件和营销邮件。
- 根据 AI 分析结果自动归档、添加标签或移动到指定文件夹。
- 根据发件人、关键词、邮件意图和业务类型匹配不同的处理规则。
- 将需要人工处理的邮件标记出来，帮助团队快速处理重点事项。
- 为后续的自动回复、工单流转、客户跟进和企业内部通知提供基础。

这种组合可以形成一套完整的智能邮箱工作流：

```text
客户发邮件
    ↓
Cloudflare Email Routing
    ↓
Mailflare 接收并保存邮件
    ↓
mailsorta.opcgrow.org 邮情 AI 分析
    ↓
返回分类与处理结果
    ↓
Mailflare 自动归档、标记、转发或通知
```

具体的 AI 分拣规则、调用方式和权限配置，可根据 mailsorta.opcgrow.org 提供的接口说明进行配置。建议通过 Webhook 或服务端 API 完成对接，避免在浏览器端暴露敏感凭据，并为接口设置独立的访问密钥和必要的权限范围。

## 开源协议

本项目遵循仓库中的 [LICENSE](LICENSE) 许可协议。
