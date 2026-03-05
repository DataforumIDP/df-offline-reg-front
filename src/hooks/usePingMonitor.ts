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
  toastDuration?: number; // добавим параметр для длительности
}

const usePingMonitor = ({
  url = 'https://rega.dataforum.pro',
  pingInterval = 30000,
  toastCooldown = 10000,
  timeout = 30000,
  showSuccessToasts = true,
  toastDuration = 5000, // по умолчанию 5 секунд
}: UsePingMonitorProps = {}) => {
  const { enqueueSnackbar } = useSnackbar();
  
  const lastToastTime = useRef<number>(0);
  const lastStatus = useRef<PingStatus>('online');
  const abortControllerRef = useRef<AbortController | null>(null);

  const showToast = useCallback((message: string, variant: 'error' | 'success' = 'error') => {
    const now = Date.now();
    
    if (now - lastToastTime.current > toastCooldown) {
      enqueueSnackbar(message, { 
        variant,
        autoHideDuration: toastDuration, // ← ВЕРНУЛ! Теперь тосты исчезают
      });
      lastToastTime.current = now;
      console.log(`🔔 ${variant === 'success' ? '✅' : '❌'} Тост:`, message);
    } else {
      console.log('⏸️ Тост заблокирован (кулдаун)');
    }
  }, [enqueueSnackbar, toastCooldown, toastDuration]);

  const checkServer = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

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
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Сервер доступен');
        
        if (lastStatus.current === 'offline') {
          if (showSuccessToasts) {
            showToast('✅ Соединение с сервером восстановлено', 'success');
          }
          lastStatus.current = 'online';
        }
        
        lastToastTime.current = 0;
        
      } else {
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (err) {
      clearTimeout(timeoutId);
      
      if (err instanceof Error && err.name === 'AbortError' && err.message.includes('aborted')) {
        console.log('⏹️ Запрос отменён');
        return;
      }

      console.log('❌ Ошибка:', err);

      let userMessage = '🔧 Сервер временно недоступен';
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          userMessage = '⏳ Сервер не отвечает (таймаут 30с)';
        } else if (err.message.includes('Failed to fetch')) {
          userMessage = '📡 Нет соединения с сервером';
        } else if (err.message.includes('NetworkError')) {
          userMessage = '🌐 Ошибка сети';
        } else if (err.message.includes('HTTP 5')) {
          userMessage = '🔧 Сервер перегружен (код 5xx)';
        } else if (err.message.includes('HTTP 4')) {
          userMessage = '🚫 Ошибка доступа к серверу (код 4xx)';
        } else if (err.message.includes('CORS')) {
          userMessage = '🔒 Проблемы с безопасным соединением (CORS)';
        }
      }

      const wasOnline = lastStatus.current === 'online';
      lastStatus.current = 'offline';

      if (wasOnline) {
        showToast(userMessage, 'error');
      } else {
        const now = Date.now();
        if (now - lastToastTime.current > toastCooldown) {
          showToast(userMessage, 'error');
        }
      }
    }
  }, [url, timeout, showSuccessToasts, showToast]);

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
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      console.log('🧹 Мониторинг остановлен');
    };
  }, [checkServer, pingInterval]);

  return {
    status: lastStatus.current,
    isOnline: lastStatus.current === 'online',
  };
};

export default usePingMonitor;