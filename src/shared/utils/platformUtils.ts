/**
 * 平台检测工具
 * 用于检测当前运行平台并应用相应的样式类
 */

export interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPWA: boolean;
  isKeyboardVisible: boolean;
}

/**
 * 检测当前平台信息
 */
export function detectPlatform(): PlatformInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isMobile = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(userAgent);
  const isTablet = /ipad|android(?!.*mobile)/.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  
  // 检测PWA模式
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator as any).standalone === true;
  
  // 检测虚拟键盘（简单检测）
  const isKeyboardVisible = window.visualViewport ? 
    window.visualViewport.height < window.screen.height * 0.75 : false;

  return {
    isIOS,
    isAndroid,
    isMobile,
    isTablet,
    isDesktop,
    isPWA,
    isKeyboardVisible
  };
}

/**
 * 应用平台样式类到document.body
 */
export function applyPlatformClasses(): void {
  const platform = detectPlatform();
  const body = document.body;
  
  // 清除之前的平台类
  body.classList.remove('platform-ios', 'platform-android', 'platform-mobile', 
                       'platform-tablet', 'platform-desktop', 'pwa-mode', 'keyboard-visible');
  
  // 应用当前平台类
  if (platform.isIOS) body.classList.add('platform-ios');
  if (platform.isAndroid) body.classList.add('platform-android');
  if (platform.isMobile) body.classList.add('platform-mobile');
  if (platform.isTablet) body.classList.add('platform-tablet');
  if (platform.isDesktop) body.classList.add('platform-desktop');
  if (platform.isPWA) body.classList.add('pwa-mode');
  if (platform.isKeyboardVisible) body.classList.add('keyboard-visible');
}

/**
 * 监听视口变化，更新键盘状态
 */
export function setupKeyboardDetection(): () => void {
  let timeoutId: number;
  
  const handleViewportChange = () => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      const platform = detectPlatform();
      const body = document.body;
      
      if (platform.isKeyboardVisible) {
        body.classList.add('keyboard-visible');
      } else {
        body.classList.remove('keyboard-visible');
      }
    }, 150); // 延迟150ms避免频繁更新
  };
  
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
      clearTimeout(timeoutId);
    };
  }
  
  // 降级方案：监听window resize
  window.addEventListener('resize', handleViewportChange);
  return () => {
    window.removeEventListener('resize', handleViewportChange);
    clearTimeout(timeoutId);
  };
}

/**
 * 初始化平台检测
 */
export function initializePlatformDetection(): () => void {
  // 立即应用平台类
  applyPlatformClasses();
  
  // 设置键盘检测
  const cleanupKeyboard = setupKeyboardDetection();
  
  // 监听显示模式变化（PWA安装/卸载）
  const mediaQuery = window.matchMedia('(display-mode: standalone)');
  const handleDisplayModeChange = () => {
    applyPlatformClasses();
  };
  
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleDisplayModeChange);
  } else {
    // 兼容旧浏览器
    mediaQuery.addListener(handleDisplayModeChange);
  }
  
  return () => {
    cleanupKeyboard();
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    } else {
      mediaQuery.removeListener(handleDisplayModeChange);
    }
  };
}