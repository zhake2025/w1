# Cloudflare Pages 部署修复说明

## 问题分析

之前的 Cloudflare Pages 部署失败主要由以下原因导致：

1. **Node.js 版本不兼容**
   - Cloudflare Pages 使用 Node.js 20.12.0
   - 项目要求 Node.js >=22.0.0
   - Vite 需要 Node.js 20.19+ 或 22.12+

2. **rolldown-vite 依赖问题**
   - `rolldown-vite` 的 native binding 在 Cloudflare 的 Linux 环境中缺失
   - 错误：`Cannot find module '@rolldown/binding-linux-x64-gnu'`

3. **构建环境差异**
   - GitHub Pages 和 Cloudflare Pages 使用不同的构建环境
   - Cloudflare Pages 对某些实验性依赖支持有限

## 解决方案

### 1. 替换 rolldown-vite 为标准 Vite
- 移除了 `rolldown-vite` 依赖
- 使用标准的 `vite@^6.0.5`
- 保持了 SWC React 插件的高性能

### 2. 调整 Node.js 版本要求
- 将 `engines.node` 从 `>=22.0.0` 降低到 `>=20.19.0`
- 更新 `.nvmrc` 为 `v20.19.0`

### 3. 添加 Cloudflare Pages 专用配置
- 创建 `wrangler.toml` 配置文件
- 指定 Node.js 版本为 20.19.0
- 配置构建命令和输出目录

### 4. 创建专用构建脚本
- `scripts/cloudflare-build.js` - Cloudflare Pages 专用构建脚本
- 自动清理缓存和依赖
- 使用 `--legacy-peer-deps` 标志避免依赖冲突

## 部署步骤

### 方法1：使用标准构建命令
```bash
npm run build
```

### 方法2：使用 Cloudflare 专用构建脚本
```bash
npm run build:cloudflare
```

## Cloudflare Pages 配置

在 Cloudflare Pages 控制台中设置：

- **构建命令**: `npm run build`
- **构建输出目录**: `dist`
- **Node.js 版本**: `20.19.0`
- **环境变量**:
  - `NODE_VERSION=20.19.0`
  - `NPM_VERSION=10.9.2`

## 验证部署

1. 检查构建日志中没有 rolldown 相关错误
2. 确认 Node.js 版本兼容性警告消失
3. 验证 `dist` 目录正确生成
4. 测试部署后的网站功能

## 为什么 GitHub Pages 成功而 Cloudflare 失败？

- **GitHub Pages** 使用 GitHub Actions，可能使用了更新的 Node.js 版本
- **Cloudflare Pages** 使用固定的构建环境，对实验性依赖支持有限
- **rolldown-vite** 是实验性项目，在不同环境中的兼容性存在差异

## 后续建议

1. 监控 Vite 6.x 的稳定性
2. 考虑在本地测试 Cloudflare Pages 构建环境
3. 定期更新依赖以获得更好的兼容性