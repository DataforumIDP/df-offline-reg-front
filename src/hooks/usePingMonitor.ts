// hooks/usePingMonitor.ts
import { useEffect, useRef, useCallback } from 'react';
import { useSnackbar } from 'notistack';

type PingStatus = 'online' | 'offline';

interface UsePingMonitorProps {
  url?: string;
  pingInterval?: number;
  toastCooldown?: number;
  timeout?: number;
  showSuccessToasts?: boolean;
  toastDuration?: number;
}

interface PingState {
  lastToastTime: number;
  lastStatus: PingStatus;
}

/**
 * Проверяет, является ли ошибка сетевой (отсутствие интернета)
 */
const isNetworkError = (err: unknown): boolean => {
  if (!(err instanceof Error)) return false;
  
  const networkPatterns = [
    'Failed to fetch',
    'NetworkError',
    'ERR_NAME_NOT_RESOLVED',
    'ERR_INTERNET_DISCONNECTED',
    'ERR_NETWORK',
  ];
  
  return (
    err.name === 'TypeError' || // fetch выбрасывает TypeError при сетевых проблемах
    networkPatterns.some(pattern => err.message.includes(pattern))
  );
};

/**
 * Проверяет, является ли ошибка таймаутом
 */
const isTimeoutError = (err: unknown): boolean => {
  return err instanceof Error && err.name === 'AbortError';
};

/**
 * Проверяет, был ли запрос отменён вручную (не по таймауту)
 */
const isManualAbort = (err: unknown): boolean => {
  return (
    err instanceof Error &&
    err.name === 'AbortError' &&
    err.message.includes('aborted')
  );
};

/**
 * Формирует сообщение для пользователя в зависимости от типа ошибки
 */
const getErrorMessage = (isTimeout: boolean): string => {
  return isTimeout
    ? '⏳ Сервер не отвечает (таймаут 30с)'
    : '📡 Нет соединения с сервером';
};

const usePingMonitor = ({
  url = 'https://rega.dataforum.pro',
  pingInterval = 30000,
  toastCooldown = 10000,
  timeout = 30000,
  showSuccessToasts = true,
  toastDuration = 5000,
}: UsePingMonitorProps = {}) => {
  const { enqueueSnackbar } = useSnackbar();
  
  const stateRef = useRef<PingState>({
    lastToastTime: 0,
    lastStatus: 'online',
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const showToast = useCallback((
    message: string,
    variant: 'error' | 'success'
  ) => {
    const now = Date.now();
    const state = stateRef.current;
    
    if (now - state.lastToastTime > toastCooldown) {
      enqueueSnackbar(message, { variant, autoHideDuration: toastDuration });
      state.lastToastTime = now;
      console.log(`🔔 ${variant === 'success' ? '✅' : '❌'} Тост:`, message);
    } else {
      console.log('⏸️ Тост заблокирован (кулдаун)');
    }
  }, [enqueueSnackbar, toastCooldown, toastDuration]);

  const handleSuccess = useCallback(() => {
    const state = stateRef.current;
    console.log('✅ Сервер доступен');
    
    if (state.lastStatus === 'offline') {
      if (showSuccessToasts) {
        showToast('✅ Соединение с сервером восстановлено', 'success');
      }
      state.lastStatus = 'online';
    }
    
    state.lastToastTime = 0; // Сброс кулдауна при успехе
  }, [showSuccessToasts, showToast]);

  const handleError = useCallback((err: unknown) => {
    const state = stateRef.current;
    
    // Запрос был отменён вручную — игнорируем
    if (isManualAbort(err)) {
      console.log('⏹️ Запрос отменён');
      return;
    }

    console.log('❌ Ошибка:', err);

    const isTimeout = isTimeoutError(err);
    const isNetwork = isNetworkError(err);

    // Показываем тост только для таймаута и сетевых ошибок
    if (isTimeout || isNetwork) {
      const wasOnline = state.lastStatus === 'online';
      state.lastStatus = 'offline';

      const shouldShowToast = wasOnline || 
        (Date.now() - state.lastToastTime > toastCooldown);

      if (shouldShowToast) {
        showToast(getErrorMessage(isTimeout), 'error');
      }
    } else {
      // HTTP ошибки (404, 5xx) — только логируем
      state.lastStatus = 'offline';
    }
  }, [toastCooldown, showToast]);

  const checkServer = useCallback(async () => {
    // Отменяем предыдущий запрос
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, timeout);

    try {
      console.log('🔄 Проверка сервера...', new Date().toLocaleTimeString());
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: abortControllerRef.current.signal,
        cache: 'no-cache',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        handleSuccess();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      handleError(err);
    }
  }, [url, timeout, handleSuccess, handleError]);

  useEffect(() => {
    let isActive = true;
    let intervalId: NodeJS.Timeout;

    const startMonitoring = async () => {
      if (!isActive) return;
      
      await checkServer();
      
      intervalId = setInterval(async () => {
        if (isActive) {
          await checkServer();
        }
      }, pingInterval);
    };

    startMonitoring();

    return () => {
      isActive = false;
      clearInterval(intervalId);
      abortControllerRef.current?.abort();
      console.log('🧹 Мониторинг остановлен');
    };
  }, [checkServer, pingInterval]);

  return {
    status: stateRef.current.lastStatus,
    isOnline: stateRef.current.lastStatus === 'online',
  };
};

export default usePingMonitor;