import React from 'react';
import { Box } from '@mui/material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

/**
 * 标签面板组件，用于在标签页中显示内容 - 使用memo优化性能
 */
const TabPanel = React.memo(function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`sidebar-tabpanel-${index}`}
      aria-labelledby={`sidebar-tab-${index}`}
      sx={{
        // 修复滚动问题：移除内层滚动，让外层容器处理滚动
        // height: 'calc(100% - 48px)', // 移除固定高度
        // overflow: 'auto', // 移除内层滚动
        padding: '10px',
        display: value === index ? 'block' : 'none',
        // 性能优化 - 简化样式，减少重排计算
        transform: 'translateZ(0)', // 启用硬件加速
        // 移除滚动条相关样式，因为不再需要内层滚动
        // 防止过度滚动
        overscrollBehavior: 'contain',
      }}
    >
      {children}
    </Box>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数：只有在value、index或children发生变化时才重新渲染
  return (
    prevProps.value === nextProps.value &&
    prevProps.index === nextProps.index &&
    prevProps.children === nextProps.children
  );
});

export default TabPanel;

/**
 * 生成标签页的辅助属性
 */
export function a11yProps(index: number) {
  return {
    id: `sidebar-tab-${index}`,
    'aria-controls': `sidebar-tabpanel-${index}`,
  };
}
