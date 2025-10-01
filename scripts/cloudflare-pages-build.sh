#!/bin/bash

echo "Installing pnpm..."
npm install -g pnpm@latest

echo "Installing dependencies..."
pnpm install --no-frozen-lockfile

echo "Building application..."
pnpm build