'use client';
import { useState, useEffect } from 'react';

export function useTypewriter(text: string, speed = 50, delay = 0) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const initTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(initTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, started]);

  return displayed;
}