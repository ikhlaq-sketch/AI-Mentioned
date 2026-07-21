"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function UpgradeLoader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isUpgrading = searchParams.get('upgrading') === 'true';
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isUpgrading) return;

    const progressInterval = setInterval(() => {
      setProgress((p) => (p < 95 ? p + Math.floor(Math.random() * 5) + 1 : 95));
    }, 800);

    const pollingInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/upgrade-status', { cache: 'no-store' });
        const data = await res.json();
        
        if (data.ready) {
          setProgress(100);
          clearInterval(pollingInterval);
          clearInterval(progressInterval);
          
          const newUrl = window.location.pathname; 
          window.history.replaceState({}, '', newUrl);
          
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 300);
        }
      } catch (err) {
        console.error("Status check failed", err);
      }
    }, 2000);

    return () => {
      clearInterval(pollingInterval);
      clearInterval(progressInterval);
    };
  }, [isUpgrading]);

  if (!isUpgrading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-sm p-4">
      <div className="text-center p-4 sm:p-6 max-w-md w-full">
        <LoadingSpinner size={40} className="mx-auto mb-4" />
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Upgrading your AI Audit...</h2>
        <p className="text-gray-500 text-sm mt-2">Generating real-time insights for your brand.</p>
        
        <div className="w-full max-w-xs mx-auto h-2 bg-gray-100 rounded-full mt-6 overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 rounded-full" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">{progress}%</p>
      </div>
    </div>
  );
}