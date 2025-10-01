import React, { useMemo, useCallback, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  useTheme,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  useMediaQuery,
  TextField,
  InputAdornment
} from '@mui/material';
import { X as CloseIcon, Check as CheckIcon, Search as SearchIcon } from 'lucide-react';
import type { Model } from '../../../shared/types';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../shared/store';

// 样式常量 - 提取重复的样式对象以提升性能
const DIALOG_STYLES = {
  dialogPaper: (fullScreen: boolean) => ({
    borderRadius: fullScreen ? 0 : 2,
    height: fullScreen ? '100%' : 'auto',
    maxHeight: fullScreen ? '100%' : '80vh'
  }),
  dialogTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    pb: 1
  },
  tabsContainer: {
    borderBottom: 1,
    borderColor: 'divider'
  },
  dialogContent: {
    px: 1,
    py: 2
  },
  list: {
    pt: 0
  }
} as const;

// ModelItem 样式常量
const MODEL_ITEM_STYLES = {
  listItem: (isSelected: boolean, isDark: boolean) => ({
    borderRadius: 1,
    mb: 0.5,
    cursor: 'pointer',
    bgcolor: isSelected
      ? isDark
        ? 'rgba(144, 202, 249, 0.16)'
        : 'rgba(25, 118, 210, 0.08)'
      : 'transparent',
    '&:hover': {
      bgcolor: isSelected
        ? isDark
          ? 'rgba(144, 202, 249, 0.24)'
          : 'rgba(25, 118, 210, 0.12)'
        : isDark
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.04)'
    }
  }),
  listItemIcon: {
    minWidth: 40
  },
  avatar: (provider: any, isSelected: boolean, primaryColor: string) => ({
    width: 28,
    height: 28,
    bgcolor: provider?.color || (isSelected ? primaryColor : 'grey.400'),
    color: 'white'
  }),
  primaryText: (isSelected: boolean) => ({
    variant: 'body1' as const,
    fontWeight: isSelected ? 'medium' : 'normal'
  }),
  secondaryText: {
    variant: 'caption' as const,
    noWrap: true
  }
} as const;

interface DialogModelSelectorProps {
  selectedModel: Model | null;
  availableModels: Model[];
  handleModelSelect: (model: Model) => void;
  handleMenuClick: () => void;
  handleMenuClose: () => void;
  menuOpen: boolean;
  hideButton?: boolean; // 是否隐藏触发按钮（用于工具栏环境）
}

// 创建稳定的空数组引用
const EMPTY_PROVIDERS_ARRAY: any[] = [];

export const DialogModelSelector: React.FC<DialogModelSelectorProps> = ({
  selectedModel,
  availableModels,
  handleModelSelect,
  handleMenuClick: _handleMenuClick, // 重命名为下划线前缀表示未使用但必需的参数
  handleMenuClose,
  menuOpen
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const providers = useSelector((state: RootState) => state.settings.providers || EMPTY_PROVIDERS_ARRAY);

  // 优化提供商名称映射 - 使用 useMemo 预计算
  const providerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    providers.forEach(provider => {
      map.set(provider.id, provider.name);
    });
    return map;
  }, [providers]);

  // 优化获取提供商名称的函数 - 使用 useCallback 和预计算的映射
  const getProviderName = useCallback((providerId: string) => {
    return providerNameMap.get(providerId) || providerId;
  }, [providerNameMap]);

  // 搜索处理函数
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  }, []);

  // 过滤模型基于搜索词
  const filteredModels = useMemo(() => {
    if (!searchTerm.trim()) {
      return availableModels;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return availableModels.filter(model => {
      const modelName = (model.name || model.id).toLowerCase();
      const modelId = model.id.toLowerCase();
      const providerName = getProviderName(model.provider || model.providerType || '').toLowerCase();
      
      return modelName.includes(searchLower) || 
             modelId.includes(searchLower) || 
             providerName.includes(searchLower);
    });
  }, [availableModels, searchTerm, getProviderName]);

  // 优化按提供商分组的模型 - 修复依赖项问题，并支持搜索过滤
  const groupedModels = useMemo(() => {
    const groups: Record<string, Model[]> = {};
    const providersMap: Record<string, { id: string, displayName: string }> = {};

    // 使用过滤后的模型列表
    filteredModels.forEach(model => {
      const providerId = model.provider || model.providerType || '未知';
      const displayName = getProviderName(providerId);

      // 使用原始ID作为键但保存显示名
      if (!providersMap[providerId]) {
        providersMap[providerId] = { id: providerId, displayName };
      }

      if (!groups[providerId]) {
        groups[providerId] = [];
      }
      groups[providerId].push(model);
    });

    // 转换为数组格式，以便可以排序
    const providersArray = Object.values(providersMap);
    // 按显示名称排序
    providersArray.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return { groups, providers: providersArray };
  }, [filteredModels, getProviderName]);

  // 优化标签页切换处理函数 - 使用 useCallback
  const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  }, []);

  // 优化模型选择处理函数 - 使用 useCallback
  const handleModelSelectWithClose = useCallback((model: Model) => {
    handleModelSelect(model);
  }, [handleModelSelect]);



  return (
    <Dialog
        open={menuOpen}
        onClose={handleMenuClose}
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: DIALOG_STYLES.dialogPaper(fullScreen)
          }
        }}
      >
        <DialogTitle sx={DIALOG_STYLES.dialogTitle}>
          选择模型
          <IconButton edge="end" onClick={handleMenuClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        {/* 搜索框 */}
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="搜索模型..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon size={20} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </Box>

        <Box sx={DIALOG_STYLES.tabsContainer}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="model provider tabs"
          >
            <Tab label="全部" value="all" />
            {groupedModels.providers.map(provider => (
              <Tab key={provider.id} label={provider.displayName} value={provider.id} />
            ))}
          </Tabs>
        </Box>

        <DialogContent sx={DIALOG_STYLES.dialogContent}>
          <List sx={DIALOG_STYLES.list}>
            {activeTab === 'all' ? (
              // 显示所有过滤后的模型
              filteredModels.map((model) => (
                <ModelItem
                  key={`${model.id}-${model.provider}`}
                  model={model}
                  isSelected={selectedModel?.id === model.id && selectedModel?.provider === model.provider}
                  onSelect={() => handleModelSelectWithClose(model)}
                  providerDisplayName={getProviderName(model.provider || model.providerType || '未知')}
                  providers={providers}
                />
              ))
            ) : (
              // 显示特定提供商的过滤后模型
              groupedModels.groups[activeTab]?.map((model) => (
                <ModelItem
                  key={`${model.id}-${model.provider}`}
                  model={model}
                  isSelected={selectedModel?.id === model.id && selectedModel?.provider === model.provider}
                  onSelect={() => handleModelSelectWithClose(model)}
                  providerDisplayName={getProviderName(model.provider || model.providerType || '未知')}
                  providers={providers}
                />
              ))
            )}
          </List>
        </DialogContent>
      </Dialog>
  );
};

interface ModelItemProps {
  model: Model;
  isSelected: boolean;
  onSelect: () => void;
  providerDisplayName: string;
  providers: any[]; // 传入 providers 避免在组件内部使用 useSelector
}

// 优化 ModelItem 组件 - 使用 React.memo 避免不必要的重新渲染
const ModelItem: React.FC<ModelItemProps> = React.memo(({
  model,
  isSelected,
  onSelect,
  providerDisplayName,
  providers
}) => {
  const theme = useTheme();

  // 优化主题相关计算 - 使用 useMemo 缓存
  const isDark = useMemo(() => theme.palette.mode === 'dark', [theme.palette.mode]);

  // 优化提供商查找 - 使用 useMemo 缓存
  const provider = useMemo(() =>
    providers?.find(p => p.id === (model.provider || model.providerType)),
    [providers, model.provider, model.providerType]
  );

  // 优化样式计算 - 使用 useMemo 缓存
  const listItemStyle = useMemo(() =>
    MODEL_ITEM_STYLES.listItem(isSelected, isDark),
    [isSelected, isDark]
  );

  const avatarStyle = useMemo(() =>
    MODEL_ITEM_STYLES.avatar(provider, isSelected, theme.palette.primary.main),
    [provider, isSelected, theme.palette.primary.main]
  );

  const primaryTextProps = useMemo(() =>
    MODEL_ITEM_STYLES.primaryText(isSelected),
    [isSelected]
  );

  return (
    <ListItem
      onClick={onSelect}
      sx={{
        ...listItemStyle,
        cursor: 'pointer',
        '&:hover': {
          ...listItemStyle['&:hover'],
          backgroundColor: isSelected
            ? (isDark ? 'rgba(144, 202, 249, 0.16)' : 'rgba(25, 118, 210, 0.08)')
            : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)')
        }
      }}
    >
      <ListItemIcon sx={MODEL_ITEM_STYLES.listItemIcon}>
        <Avatar sx={avatarStyle}>
          {provider?.avatar || providerDisplayName[0]}
        </Avatar>
      </ListItemIcon>
      <ListItemText
        primary={model.name}
        secondary={model.description || `${providerDisplayName}模型`}
        slotProps={{
          primary: primaryTextProps,
          secondary: MODEL_ITEM_STYLES.secondaryText
        }}
      />
      {isSelected && (
        <CheckIcon color="primary" fontSize="small" />
      )}
    </ListItem>
  );
});

export default DialogModelSelector;