# GitHub Pages 手动部署指南

本指南将教你如何手动部署PWA项目到GitHub Pages，无需使用GitHub Actions自动化流程。

## 项目结构说明

- `main` 分支：存放源代码，用于开发
- `gh-pages` 分支：存放构建后的静态文件，用于GitHub Pages部署

## 初次设置（已完成）

✅ 项目已经配置完成，包括：
- 删除了GitHub Actions自动化流程
- 配置了远程仓库
- 创建了gh-pages分支
- 推送了初始代码

## 每次更新部署的完整步骤

### 步骤1：在main分支进行开发

确保你在main分支上进行所有的开发工作：

```bash
# 检查当前分支
git branch

# 如果不在main分支，切换到main分支
git checkout main

# 进行你的开发工作...
# 编辑文件、添加功能等

# 提交你的更改
git add .
git commit -m "你的提交信息"
git push origin main
```

### 步骤2：构建项目

在main分支上运行构建命令：

```bash
npm run build
```

这将在 `dist/` 目录中生成优化后的静态文件。

### 步骤3：切换到gh-pages分支

```bash
git checkout gh-pages
```

### 步骤4：清理并复制新的构建文件

#### 4.1 删除旧的文件（保留.git目录）

**Windows PowerShell:**
```powershell
# 删除所有文件和文件夹，但保留.git目录
Get-ChildItem -Path . -Exclude .git | Remove-Item -Recurse -Force
```

**或者手动删除：**
- 删除除了 `.git` 文件夹以外的所有文件和文件夹

#### 4.2 复制dist目录内容到根目录

**Windows PowerShell:**
```powershell
# 切换回main分支获取最新的构建文件
git checkout main
npm run build
git checkout gh-pages

# 复制dist目录内容到当前目录
Copy-Item -Path "dist/*" -Destination "." -Recurse -Force

# 删除dist目录（因为我们已经把内容复制到根目录了）
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
```

### 步骤5：提交并推送到gh-pages分支

```bash
# 添加所有文件
git add .

# 提交更改
git commit -m "Deploy: 更新网站内容"

# 推送到远程gh-pages分支
git push origin gh-pages
```

### 步骤6：切换回main分支继续开发

```bash
git checkout main
```

## 完整的一键部署脚本

为了简化部署过程，你可以创建一个PowerShell脚本：

### 创建 `deploy.ps1` 文件：

```powershell
# deploy.ps1 - 一键部署脚本

Write-Host "开始部署到GitHub Pages..." -ForegroundColor Green

# 确保在main分支
git checkout main

# 构建项目
Write-Host "构建项目..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "构建失败！" -ForegroundColor Red
    exit 1
}

# 切换到gh-pages分支
Write-Host "切换到gh-pages分支..." -ForegroundColor Yellow
git checkout gh-pages

# 清理旧文件
Write-Host "清理旧文件..." -ForegroundColor Yellow
Get-ChildItem -Path . -Exclude .git | Remove-Item -Recurse -Force

# 从main分支复制构建文件
Write-Host "复制构建文件..." -ForegroundColor Yellow
git checkout main
npm run build
git checkout gh-pages
Copy-Item -Path "dist/*" -Destination "." -Recurse -Force
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue

# 提交并推送
Write-Host "提交并推送..." -ForegroundColor Yellow
git add .
git commit -m "Deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git push origin gh-pages

# 切换回main分支
git checkout main

Write-Host "部署完成！" -ForegroundColor Green
Write-Host "网站将在几分钟内更新：https://zhake2025.github.io/w1/" -ForegroundColor Cyan
```

### 使用部署脚本：

```powershell
# 给脚本执行权限（首次运行时）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 运行部署脚本
.\deploy.ps1
```

## 注意事项

1. **分支管理**：
   - 始终在 `main` 分支进行开发
   - `gh-pages` 分支只用于部署，不要在此分支进行开发

2. **文件管理**：
   - 不要将 `node_modules`、源代码等开发文件推送到 `gh-pages` 分支
   - 只推送构建后的静态文件

3. **GitHub Pages设置**：
   - 确保在GitHub仓库设置中，Pages源设置为 `gh-pages` 分支
   - 网站地址：https://zhake2025.github.io/w1/

4. **部署时间**：
   - GitHub Pages通常需要几分钟时间来更新网站
   - 可以在仓库的Actions标签页查看部署状态

## 故障排除

### 如果构建失败：
```bash
# 清理node_modules并重新安装
rm -rf node_modules
npm install
npm run build
```

### 如果推送失败：
```bash
# 检查网络连接和Git配置
git config --list
git remote -v
```

### 如果网站没有更新：
1. 检查GitHub仓库的Pages设置
2. 查看仓库的Actions页面是否有错误
3. 等待几分钟后再次检查

---

**快速参考命令：**
```bash
# 完整部署流程
git checkout main          # 切换到开发分支
npm run build              # 构建项目
git checkout gh-pages      # 切换到部署分支
# [清理并复制文件]
git add .                  # 添加文件
git commit -m "Deploy"     # 提交
git push origin gh-pages   # 推送
git checkout main          # 回到开发分支
```