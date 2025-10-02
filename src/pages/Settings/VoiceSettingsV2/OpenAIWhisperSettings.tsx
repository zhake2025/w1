import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
  Button,
} from '@mui/material';
import {
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import { getStorageItem, setStorageItem } from '../../../shared/utils/storage';
import { OpenAIWhisperTab, WhisperTestSection } from '../../../components/VoiceRecognition';
import type { VoiceRecognitionSettings, OpenAIWhisperSettings as OpenAIWhisperSettingsType } from '../../../shared/types/voice';

const OpenAIWhisperSettings: React.FC = () => {
  const navigate = useNavigate();

  // 状态管理
  const [whisperSettings, setWhisperSettings] = useState<OpenAIWhisperSettingsType>({
    apiKey: '',
    showApiKey: false,
    model: 'whisper-1',
    language: 'zh',
    temperature: 0,
    responseFormat: 'json',
  });

  const [speechRecognitionSettings, setSpeechRecognitionSettings] = useState<VoiceRecognitionSettings>({
    enabled: true,
    language: 'zh-CN',
    autoStart: false,
    silenceTimeout: 2000,
    maxResults: 5,
    partialResults: true,
    permissionStatus: 'unknown',
    provider: 'openai',
  });

  const [uiState, setUIState] = useState({
    saveError: '',
  });

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // 加载OpenAI Whisper设置
        const storedWhisperApiKey = await getStorageItem<string>('whisper_api_key') || '';
        const storedWhisperModel = await getStorageItem<string>('whisper_model') || 'whisper-1';
        const storedWhisperLanguage = await getStorageItem<string>('whisper_language') || 'zh';
        const storedWhisperTemperature = Number(await getStorageItem<string>('whisper_temperature') || '0');
        const storedWhisperResponseFormat = await getStorageItem<string>('whisper_response_format') || 'json';

        // 加载语音识别设置
        const storedSpeechRecognitionEnabled = (await getStorageItem<string>('speech_recognition_enabled')) !== 'false';
        const storedSpeechRecognitionLanguage = await getStorageItem<string>('speech_recognition_language') || 'zh-CN';
        const storedSpeechRecognitionAutoStart = (await getStorageItem<string>('speech_recognition_auto_start')) === 'true';
        const storedSpeechRecognitionSilenceTimeout = Number(await getStorageItem<string>('speech_recognition_silence_timeout') || '2000');
        const storedSpeechRecognitionMaxResults = Number(await getStorageItem<string>('speech_recognition_max_results') || '5');
        const storedSpeechRecognitionPartialResults = (await getStorageItem<string>('speech_recognition_partial_results')) !== 'false';

        setWhisperSettings({
          apiKey: storedWhisperApiKey,
          showApiKey: false,
          model: storedWhisperModel,
          language: storedWhisperLanguage,
          temperature: storedWhisperTemperature,
          responseFormat: storedWhisperResponseFormat as any,
        });

        setSpeechRecognitionSettings({
          enabled: storedSpeechRecognitionEnabled,
          language: storedSpeechRecognitionLanguage,
          autoStart: storedSpeechRecognitionAutoStart,
          silenceTimeout: storedSpeechRecognitionSilenceTimeout,
          maxResults: storedSpeechRecognitionMaxResults,
          partialResults: storedSpeechRecognitionPartialResults,
          permissionStatus: 'unknown',
          provider: 'openai',
        });
      } catch (error) {
        console.error('加载OpenAI Whisper设置失败:', error);
      }
    };

    loadSettings();
  }, []);

  // 保存设置
  const handleSave = useCallback(async () => {
    try {
      // 保存OpenAI Whisper设置
      await setStorageItem('whisper_api_key', whisperSettings.apiKey);
      await setStorageItem('whisper_model', whisperSettings.model);
      await setStorageItem('whisper_language', whisperSettings.language || '');
      await setStorageItem('whisper_temperature', whisperSettings.temperature?.toString() || '0');
      await setStorageItem('whisper_response_format', whisperSettings.responseFormat || 'json');

      // 保存语音识别设置
      await setStorageItem('speech_recognition_enabled', speechRecognitionSettings.enabled.toString());
      await setStorageItem('speech_recognition_language', speechRecognitionSettings.language);
      await setStorageItem('speech_recognition_auto_start', speechRecognitionSettings.autoStart.toString());
      await setStorageItem('speech_recognition_silence_timeout', speechRecognitionSettings.silenceTimeout.toString());
      await setStorageItem('speech_recognition_max_results', speechRecognitionSettings.maxResults.toString());
      await setStorageItem('speech_recognition_partial_results', speechRecognitionSettings.partialResults.toString());
      await setStorageItem('speech_recognition_provider', 'openai');

      // 保存成功后返回上级页面
      setTimeout(() => {
        navigate('/settings/voice');
      }, 0);


    } catch (error) {
      console.error('保存OpenAI Whisper设置失败:', error);
      setUIState(prev => ({
        ...prev,
        saveError: '保存设置失败，请重试',
      }));
    }
  }, [whisperSettings, speechRecognitionSettings]);



  const handleBack = () => {
    navigate('/settings/voice');
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      bgcolor: 'background.default'
    }}>
      {/* 顶部导航栏 */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.8)',
          '@media (prefers-color-scheme: dark)': {
            background: 'rgba(18, 18, 18, 0.8)',
          },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1, sm: 2, md: 3 } }}>
          <IconButton
            edge="start"
            onClick={handleBack}
            aria-label="返回"
            size="large"
            sx={{
              color: 'primary.main',
              mr: { xs: 1, sm: 2 },
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ArrowLeft size={20} />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              backgroundImage: 'linear-gradient(90deg, #9333EA, #754AB4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            OpenAI Whisper 设置
          </Typography>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              borderRadius: 2,
              px: 3,
            }}
          >
            保存
          </Button>
        </Toolbar>
      </AppBar>

      {/* 可滚动的内容区域 */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          mt: 8,
          bgcolor: (theme) => theme.palette.mode === 'light'
            ? alpha(theme.palette.primary.main, 0.02)
            : alpha(theme.palette.background.default, 0.9),
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '3px',
          },
        }}
      >
        <Box
          sx={{
            width: '100%',
          }}
        >
          {/* 错误提示 */}
          {uiState.saveError && (
            <Alert
              severity="error"
              sx={{
                mb: { xs: 1.5, sm: 2 },
                borderRadius: { xs: 1, sm: 2 },
              }}
            >
              {uiState.saveError}
            </Alert>
          )}

          {/* 配置区域 */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              background: 'background.paper',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <OpenAIWhisperTab
              settings={whisperSettings}
              onSettingsChange={setWhisperSettings}
            />
          </Paper>

          {/* 测试区域 */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              background: 'background.paper',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <WhisperTestSection
              settings={whisperSettings}
              enabled={speechRecognitionSettings.enabled}
            />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default OpenAIWhisperSettings;
