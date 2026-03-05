import { useEffect, useRef, useCallback } from 'react';
import { useSnackbar } from 'notistack';

type PingStatus = 'online' | 'offline';

interface UsePingMonitorProps {
  url?: string; // можно передать любой URL
  pingInterval?: number; // интервал проверки
  toastCooldown?: number; // кулдаун тостов
  timeout?: number; // таймаут запроса
  showSuccessToasts?: boolean; // показывать ли тосты о восстановлении
}

const usePingMonitor = ({
  url = 'https://rega.dataforum.pro',
  pingInterval = 30000,
  toastCooldown = 10000,
  timeout = 30000,
  showSuccessToasts = true,
}: UsePingMonitorProps = {}) => {
  const { enqueueSnackbar } = useSnackbar();
  
  // Используем useRef чтобы не вызывать перерендеры
  const lastToastTime = useRef<number>(0);
  const lastStatus = useRef<PingStatus>('online');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Функция показа тоста с кулдауном
  const showToast = useCallback((message: string, variant: 'error' | 'success' = 'error') => {
    const now = Date.now();
    
    if (now - lastToastTime.current > toastCooldown) {
      enqueueSnackbar(message, { 
        variant,
        autoHideDuration: 5000,
      });
      lastToastTime.current = now;
      console.log(`🔔 ${variant === 'success' ? '✅' : '❌'} Тост:`, message);
    } else {
      console.log('⏸️ Тост заблокирован (кулдаун)');
    }
  }, [enqueueSnackbar, toastCooldown]);

  // Основная функция проверки
  const checkServer = useCallback(async () => {
    // Отменяем предыдущий запрос, если он ещё выполняется
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Создаём новый контроллер для этого запроса
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
        mode: 'cors', // явно указываем cors
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Сервер доступен');
        
        // Если сервер был офлайн, а теперь онлайн
        if (lastStatus.current === 'offline') {
          if (showSuccessToasts) {
            showToast('✅ Соединение с сервером восстановлено', 'success');
          }
          lastStatus.current = 'online';
        }
        
        // Сбрасываем счётчик тостов при успехе
        lastToastTime.current = 0;
        
      } else {
        // Сервер ответил, но с ошибкой
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (err) {
      clearTimeout(timeoutId);
      
      // Не показываем ошибку если это намеренная отмена
      if (err instanceof Error && err.name === 'AbortError' && err.message.includes('aborted')) {
        console.log('Запрос отменён');
        return;
      }

      console.log('❌ Ошибка:', err);

      // Определяем сообщение для пользователя
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

      // Проверяем, был ли сервер только что онлайн
      const wasOnline = lastStatus.current === 'online';
      lastStatus.current = 'offline';

      // Показываем тост при первом падении или по кулдауну
      if (wasOnline) {
        showToast(userMessage, 'error');
      } else {
        const now = Date.now();
        if (now - lastToastTime.current > toastCooldown) {
          showToast(userMessage, 'error');
        }
      }
    }
  }, [url, timeout, showSuccessToasts, showToast, toastCooldown]);

  // Запускаем и останавливаем мониторинг
  useEffect(() => {
    let isActive = true;
    let intervalId: NodeJS.Timeout;

    const startMonitoring = async () => {
      if (!isActive) return;
      
      // Первая проверка
      await checkServer();
      
      // Запускаем интервал
      intervalId = setInterval(async () => {
        if (isActive) {
          await checkServer();
        }
      }, pingInterval);
    };

    startMonitoring();

    // Очистка при размонтировании
    return () => {
      isActive = false;
      clearInterval(intervalId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      console.log('🧹 Мониторинг остановлен');
    };
  }, [checkServer, pingInterval]);

  // Возвращаем текущий статус на случай, если компонент хочет его использовать
  return {
    status: lastStatus.current,
    isOnline: lastStatus.current === 'online',
  };
};

export default usePingMonitor;