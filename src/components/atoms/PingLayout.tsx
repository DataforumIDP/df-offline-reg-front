import React, { useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';

const PingMonitor: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  const lastToastTime = useRef<number>(0);
  const lastStatus = useRef<'online' | 'offline'>('online');
  const TOAST_COOLDOWN = 10000; // 10 секунд
  const PING_INTERVAL = 30000; // 30 секунд

  const showToast = (message: string, variant: 'error' | 'success' = 'error') => {
    const now = Date.now();
    
    if (now - lastToastTime.current > TOAST_COOLDOWN) {
      enqueueSnackbar(message, { 
        variant,
        autoHideDuration: 5000,
      });
      lastToastTime.current = now;
      console.log('🔔 Тост показан:', message);
    } else {
      console.log('⏸️ Тост заблокирован (кулдаун)');
    }
  };

  useEffect(() => {
    let isActive = true;
    let intervalId: NodeJS.Timeout;

    const checkServer = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        console.log('🔄 Проверка сервера...');
        
        const response = await fetch('https://rega.dataforum.pro', {
          method: 'HEAD',
          signal: controller.signal,
          // Убираем no-cors! Он ломает обработку ошибок
          // mode: 'no-cors', 
        });

        clearTimeout(timeoutId);
        
        if (!isActive) return;

        // Проверяем статус ответа
        if (response.ok) {
          console.log('✅ Сервер доступен');
          
          // Если сервер был офлайн, а теперь онлайн
          if (lastStatus.current === 'offline') {
            showToast('✅ Соединение с сервером восстановлено', 'success');
          }
          
          lastStatus.current = 'online';
          lastToastTime.current = 0; // сбрасываем кулдаун ошибок
        } else {
          // Сервер ответил, но с ошибкой (500, 404 и т.д.)
          throw new Error(`HTTP ${response.status}`);
        }

      } catch (err) {
        clearTimeout(timeoutId);
        
        if (!isActive) return;

        console.log('❌ Ошибка:', err);

        // Определяем сообщение для пользователя
        let userMessage = 'Сервер временно недоступен';
        
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            userMessage = 'Сервер не отвечает (таймаут 30с)';
          } else if (err.message.includes('Failed to fetch')) {
            userMessage = 'Нет соединения с сервером';
          } else if (err.message.includes('NetworkError')) {
            userMessage = 'Ошибка сети';
          } else if (err.message.includes('HTTP 5')) {
            userMessage = 'Сервер перегружен (код 5xx)';
          } else if (err.message.includes('HTTP 4')) {
            userMessage = 'Ошибка доступа к серверу (код 4xx)';
          }
        }

        // Проверяем, был ли сервер только что онлайн
        const wasOnline = lastStatus.current === 'online';
        lastStatus.current = 'offline';

        // Показываем тост при первом падении или по кулдауну
        if (wasOnline) {
          showToast(userMessage, 'error');
        } else {
          // Если сервер уже был офлайн, проверяем кулдаун
          const now = Date.now();
          if (now - lastToastTime.current > TOAST_COOLDOWN) {
            showToast(userMessage, 'error');
          }
        }
      }
    };

    // Запускаем первую проверку
    checkServer();
    
    // Запускаем интервал
    intervalId = setInterval(checkServer, PING_INTERVAL);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, []);

  return null;
};

export default PingMonitor;