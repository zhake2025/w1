import React from 'react';
import {
  Select,
  MenuItem,
  Typography,
  useTheme,
  Box,
  ListSubheader,
  Avatar,
  useMediaQuery
} from '@mui/material';
import type { Model } from '../../../shared/types';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../shared/store';
import type { SelectChangeEvent } from '@mui/material';
import { UnifiedModelDisplay } from './UnifiedModelDisplay';

interface DropdownModelSelectorProps {
  selectedModel: Model | null;
  availableModels: Model[];
  handleModelSelect: (model: Model) => void;
  displayStyle?: 'icon' | 'text';
}

export const DropdownModelSelector: React.FC<DropdownModelSelectorProps> = ({
  selectedModel,
  availableModels,
  handleModelSelect,
  displayStyle = 'text'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const providers = useSelector((state: RootState) => state.settings.providers || []);

  // 获取提供商名称的函数
  const getProviderName = React.useCallback((providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    // 如果找到提供商，返回用户设置的名称
    if (provider) {
      return provider.name;
    }
    // 没有找到，返回原始ID
    return providerId;
  }, [providers]);

  // 获取提供商信息的函数
  const getProviderInfo = React.useCallback((providerId: string) => {
    return providers.find(p => p.id === providerId);
  }, [providers]);

  // 按供应商分组模型
  const groupedModels = React.useMemo(() => {
    const groups: { [key: string]: Model[] } = {};

    availableModels.forEach(model => {
      const providerId = model.provider || model.providerType || 'unknown';
      if (!groups[providerId]) {
        groups[providerId] = [];
      }
      groups[providerId].push(model);
    });

    // 按照设置中的供应商顺序排序
    const sortedGroups = Object.keys(groups).sort((a, b) => {
      const indexA = providers.findIndex(p => p.id === a);
      const indexB = providers.findIndex(p => p.id === b);

      // 如果都在providers中，按照providers中的顺序
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // 如果只有一个在providers中，优先显示在providers中的
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      // 如果都不在providers中，按字母顺序
      const nameA = getProviderName(a);
      const nameB = getProviderName(b);
      return nameA.localeCompare(nameB);
    });

    return { groups, sortedGroups };
  }, [availableModels, getProviderName, providers]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const compositeValue = event.target.value;
    if (!compositeValue || typeof compositeValue !== 'string') return;

    try {
      // 从复合值中提取模型ID和提供商
      const [modelId, providerId] = compositeValue.split('---');

      // 找到匹配ID和提供商的模型
      const model = availableModels.find(m =>
        m.id === modelId && (m.provider || '') === providerId
      );

      if (model) {
        // 使用setTimeout防止事件处理冲突
        setTimeout(() => {
          handleModelSelect(model);
        }, 0);
      } else {
        console.error('未找到匹配的模型:', modelId, providerId);
      }
    } catch (error) {
      console.error('处理模型选择时出错:', error);
    }
  };

  // 生成唯一的复合值，防止-字符在modelId或providerId中导致的解析错误
  const getCompositeValue = React.useCallback((model: Model): string => {
    return `${model.id}---${model.provider || ''}`;
  }, []);

  // 获取当前选中模型的复合值
  const getCurrentValue = React.useCallback((): string => {
    if (!selectedModel) return '';

    // 首先尝试在 availableModels 中找到完全匹配的模型（id + provider）
    const exactMatch = availableModels.find(m =>
      m.id === selectedModel.id &&
      (m.provider || '') === (selectedModel.provider || '')
    );

    if (exactMatch) {
      return getCompositeValue(exactMatch);
    }

    // 如果没有找到完全匹配，尝试只匹配 id，但优先选择第一个匹配的
    const idMatch = availableModels.find(m => m.id === selectedModel.id);
    if (idMatch) {
      return getCompositeValue(idMatch);
    }

    // 如果都没找到，返回原始的复合值（可能导致不匹配，但至少不会崩溃）
    return getCompositeValue(selectedModel);
  }, [selectedModel, getCompositeValue, availableModels]);

  // 处理下拉菜单打开状态
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Box sx={{ position: 'relative' }}>
      <UnifiedModelDisplay
        selectedModel={selectedModel}
        onClick={handleOpen}
        displayStyle={displayStyle}
      />
      <Select
        open={open}
        onClose={handleClose}
        onOpen={handleOpen}
        value={getCurrentValue()}
        onChange={handleChange}
        displayEmpty
        renderValue={() => null}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          pointerEvents: open ? 'auto' : 'none',
          '& .MuiSelect-select': {
            padding: 0,
            border: 'none',
            bgcolor: 'transparent',
          },
          '& .MuiSelect-icon': {
            display: 'none',
          },
          '&:before': {
            display: 'none',
          },
          '&:after': {
            display: 'none',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          }
        }}
        MenuProps={{
          disableAutoFocus: true,
          disableRestoreFocus: true,
          disableEnforceFocus: true,
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
          slotProps: {
            paper: {
              sx: {
                maxHeight: isMobile ? '50vh' : '70vh', // 移动端减少高度避免超出屏幕
                minHeight: isMobile ? 150 : 300,
                width: isMobile ? '85vw' : 'auto', // 移动端使用更大宽度
                maxWidth: isMobile ? '85vw' : 400,
                minWidth: isMobile ? '300px' : 280,
                mt: 0.5,
                // 移动端确保不超出屏幕边界
                ...(isMobile && {
                  maxWidth: 'calc(100vw - 32px)', // 留出边距
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }),
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                bgcolor: theme.palette.mode === 'dark' ? '#2A2A2A' : theme.palette.background.paper,
                borderRadius: 1,
                '& .MuiList-root': {
                  py: 0,
                  bgcolor: 'transparent',
                  '&:focus': {
                    outline: 'none'
                  }
                }
              }
            },
            root: {
              slotProps: {
                backdrop: {
                  invisible: true, // 保持透明背景，维持下拉效果
                  sx: {
                    backgroundColor: 'transparent'
                  }
                }
              }
            }
          }
        }}
      >
        {groupedModels.sortedGroups.flatMap((providerId) => {
          const providerName = getProviderName(providerId);
          const providerInfo = getProviderInfo(providerId);
          const models = groupedModels.groups[providerId];

          return [
            // 供应商分组标题
            <ListSubheader
              key={`header-${providerId}`}
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? '#3A3A3A' : '#F5F5F5', // 更明显的背景色
                fontWeight: 600,
                fontSize: '0.8rem', // 减小字体大小
                py: 0.75, // 减少垂直内边距
                px: 2,
                minHeight: 32, // 设置最小高度
                display: 'flex',
                alignItems: 'center',
                gap: 0.75, // 减少间距
                position: 'sticky', // 粘性定位
                top: 0, // 固定在顶部
                zIndex: 10, // 确保在其他元素之上
                borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                '&:not(:first-of-type)': {
                  borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`
                }
              }}
            >
              <Avatar
                sx={{
                  width: 16, // 减小头像大小
                  height: 16,
                  bgcolor: providerInfo?.color || theme.palette.primary.main,
                  fontSize: '0.65rem' // 减小字体大小
                }}
              >
                {providerInfo?.avatar || providerName[0]}
              </Avatar>
              {providerName}
            </ListSubheader>,
            // 该供应商下的模型
            ...models.map((model) => {
              const compositeValue = getCompositeValue(model);

              return (
                <MenuItem
                  key={compositeValue}
                  value={compositeValue}
                  sx={{
                    py: 1, // 减少垂直内边距
                    pl: 3, // 减少左边距
                    pr: 2,
                    minHeight: 40, // 设置最小高度
                    bgcolor: 'transparent',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                    },
                    '&.Mui-selected': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.15)'
                      }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '100%' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.875rem', // 稍微减小字体
                          lineHeight: 1.3, // 减少行高
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%'
                        }}
                        title={model.name} // 悬停显示完整名称
                      >
                        {model.name}
                      </Typography>
                      {model.description && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            fontSize: '0.75rem', // 减小描述字体
                            lineHeight: 1.2,
                            mt: 0.25, // 减少上边距
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%'
                          }}
                          title={model.description} // 悬停显示完整描述
                        >
                          {model.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </MenuItem>
              );
            }).filter(Boolean)
          ].filter(Boolean);
        })}
      </Select>
    </Box>
  );
};

export default DropdownModelSelector;