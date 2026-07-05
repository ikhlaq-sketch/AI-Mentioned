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

    // 1. Progress Bar Logic
    const progressInterval = setInterval(() => {
      setProgress((p) => (p < 95 ? p + Math.floor(Math.random() * 5) + 1 : 95));
    }, 800);

    // 2. Polling Logic
    const pollingInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/upgrade-status', { cache: 'no-store' });
        const data = await res.json();
        
        if (data.ready) {
          setProgress(100);
          clearInterval(pollingInterval);
          clearInterval(progressInterval);
          
          // --- THE CRITICAL FIX ---
          // 1. Use the native browser history to remove the query param WITHOUT a full refresh yet
          const newUrl = window.location.pathname; 
          window.history.replaceState({}, '', newUrl);
          
          // 2. Now force the hard reload so the UI updates with the new real data
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

  // If not upgrading, don't render anything
  if (!isUpgrading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="text-center p-6">
        <LoadingSpinner size={48} className="mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Upgrading your AI Audit...</h2>
        <p className="text-gray-500 text-sm mt-2">Generating real-time insights for your brand.</p>
        
        {/* Progress Bar */}
        <div className="w-64 h-2 bg-gray-100 rounded-full mt-6 mx-auto overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}