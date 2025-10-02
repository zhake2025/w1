# quick-deploy.ps1 - 快速部署脚本（简化版）
# 使用方法：.\quick-deploy.ps1

Write-Host "快速部署到GitHub Pages..." -ForegroundColor Cyan

# 构建项目
Write-Host "构建项目..." -ForegroundColor Yellow
git checkout main
npm run build

# 切换到gh-pages分支并部署
Write-Host "部署到gh-pages..." -ForegroundColor Yellow
git checkout gh-pages
Get-ChildItem -Path . -Exclude .git, "*.ps1" | Remove-Item -Recurse -Force
git checkout main -- dist
Copy-Item -Path "dist/*" -Destination "." -Recurse -Force
Remove-Item -Path "dist" -Recurse -Force

# 提交并推送
git add .
git commit -m "Deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git push origin gh-pages

# 回到main分支
git checkout main

Write-Host "部署完成！网站：https://zhake2025.github.io/w1/" -ForegroundColor Green