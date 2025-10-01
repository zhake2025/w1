#!/usr/bin/env node

/**
 * Cloudflare Pages 专用构建脚本
 * 解决 Node.js 版本兼容性和依赖问题
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 开始 Cloudflare Pages 构建...');

// 检查 Node.js 版本
const nodeVersion = process.version;
console.log(`📦 当前 Node.js 版本: ${nodeVersion}`);

// 检查依赖是否存在
console.log('📦 检查依赖...');
if (!fs.existsSync('node_modules')) {
  console.log('📦 安装依赖...');
  try {
    execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ 依赖安装失败:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ 依赖已存在，跳过安装步骤');
}

// 构建项目
console.log('🔨 构建项目...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ 构建成功完成！');
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}

console.log('🎉 Cloudflare Pages 构建完成！');