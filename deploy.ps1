# deploy.ps1 - PWA项目一键部署到GitHub Pages脚本
# 使用方法：在PowerShell中运行 .\deploy.ps1

param(
    [string]$CommitMessage = "Deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    PWA GitHub Pages 部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否在Git仓库中
if (-not (Test-Path ".git")) {
    Write-Host "错误：当前目录不是Git仓库！" -ForegroundColor Red
    exit 1
}

# 检查是否有未提交的更改
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "警告：检测到未提交的更改" -ForegroundColor Yellow
    Write-Host "未提交的文件：" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $continue = Read-Host "是否继续部署？(y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "部署已取消" -ForegroundColor Yellow
        exit 0
    }
}

try {
    # 1. 确保在main分支
    Write-Host "1. 切换到main分支..." -ForegroundColor Green
    $currentBranch = git branch --show-current
    if ($currentBranch -ne "main") {
        git checkout main
        if ($LASTEXITCODE -ne 0) {
            throw "切换到main分支失败"
        }
    }
    Write-Host "   ✓ 当前在main分支" -ForegroundColor Gray

    # 2. 拉取最新代码
    Write-Host "2. 拉取最新代码..." -ForegroundColor Green
    git pull origin main
    Write-Host "   ✓ 代码已更新" -ForegroundColor Gray

    # 3. 安装依赖（如果需要）
    if (-not (Test-Path "node_modules")) {
        Write-Host "3. 安装依赖..." -ForegroundColor Green
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "依赖安装失败"
        }
        Write-Host "   ✓ 依赖安装完成" -ForegroundColor Gray
    } else {
        Write-Host "3. 跳过依赖安装（node_modules已存在）" -ForegroundColor Green
    }

    # 4. 构建项目
    Write-Host "4. 构建项目..." -ForegroundColor Green
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "项目构建失败"
    }
    Write-Host "   ✓ 项目构建完成" -ForegroundColor Gray

    # 5. 检查dist目录
    if (-not (Test-Path "dist")) {
        throw "构建失败：找不到dist目录"
    }

    # 6. 切换到gh-pages分支
    Write-Host "5. 切换到gh-pages分支..." -ForegroundColor Green
    git checkout gh-pages
    if ($LASTEXITCODE -ne 0) {
        throw "切换到gh-pages分支失败"
    }
    Write-Host "   ✓ 已切换到gh-pages分支" -ForegroundColor Gray

    # 7. 清理旧文件
    Write-Host "6. 清理旧文件..." -ForegroundColor Green
    Get-ChildItem -Path . -Exclude .git, deploy.ps1 | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ 旧文件已清理" -ForegroundColor Gray

    # 8. 从main分支获取构建文件
    Write-Host "7. 获取最新构建文件..." -ForegroundColor Green
    git checkout main -- dist
    if ($LASTEXITCODE -ne 0) {
        throw "获取构建文件失败"
    }

    # 9. 复制dist内容到根目录
    Write-Host "8. 复制构建文件到根目录..." -ForegroundColor Green
    Copy-Item -Path "dist/*" -Destination "." -Recurse -Force
    Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ 文件复制完成" -ForegroundColor Gray

    # 10. 检查是否有更改
    $changes = git status --porcelain
    if (-not $changes) {
        Write-Host "没有检测到更改，跳过部署" -ForegroundColor Yellow
        git checkout main
        exit 0
    }

    # 11. 提交并推送
    Write-Host "9. 提交并推送到GitHub..." -ForegroundColor Green
    git add .
    git commit -m $CommitMessage
    if ($LASTEXITCODE -ne 0) {
        throw "提交失败"
    }

    git push origin gh-pages
    if ($LASTEXITCODE -ne 0) {
        throw "推送失败"
    }
    Write-Host "   ✓ 推送完成" -ForegroundColor Gray

    # 12. 切换回main分支
    Write-Host "10. 切换回main分支..." -ForegroundColor Green
    git checkout main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "警告：切换回main分支失败" -ForegroundColor Yellow
    } else {
        Write-Host "   ✓ 已切换回main分支" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "           部署成功完成！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "网站将在几分钟内更新：" -ForegroundColor Cyan
    Write-Host "https://zhake2025.github.io/w1/" -ForegroundColor Blue
    Write-Host ""
    Write-Host "你可以在以下位置查看部署状态：" -ForegroundColor Cyan
    Write-Host "https://github.com/zhake2025/w1/deployments" -ForegroundColor Blue

} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "           部署失败！" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "错误信息：$($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "请检查以下内容：" -ForegroundColor Yellow
    Write-Host "1. 网络连接是否正常" -ForegroundColor Yellow
    Write-Host "2. Git配置是否正确" -ForegroundColor Yellow
    Write-Host "3. 是否有权限推送到仓库" -ForegroundColor Yellow
    Write-Host "4. 项目是否能正常构建" -ForegroundColor Yellow
    
    # 尝试切换回main分支
    Write-Host ""
    Write-Host "尝试切换回main分支..." -ForegroundColor Yellow
    git checkout main
    
    exit 1
}