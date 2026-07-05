"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function UpgradeLoader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isUpgrading = searchParams.get('upgrading') === 'true';
  const [progress, setProgress] = useState(0);

  // 1. Faux Progress Bar Animation
  useEffect(() => {
    if (!isUpgrading) return;
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        // Jump quickly to 85%, then slowly crawl to 95% while waiting for AI
        if (p < 85) return p + Math.floor(Math.random() * 8) + 2;
        if (p < 95) return p + 1;
        return p; 
      });
    }, 600);
    return () => clearInterval(progressInterval);
  }, [isUpgrading]);

  // 2. Poll the API to check if AI generation is actually finished
  useEffect(() => {
    if (!isUpgrading) return;
    
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/upgrade-status');
        const data = await res.json();
        
        if (data.ready) {
          setProgress(100);
          clearInterval(pollingInterval);
          
          // Wait half a second at 100% for a smooth visual transition, then refresh
          setTimeout(() => {
            router.replace('/dashboard');
            router.refresh();
          }, 500);
        }
      } catch (err) {
        console.error("Status check failed", err);
      }
    };

    const pollingInterval = setInterval(checkStatus, 3000); // Check every 3 seconds
    return () => clearInterval(pollingInterval);
  }, [isUpgrading, router]);

  if (!isUpgrading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
      <div className="w-full max-w-md p-8 bg-white border border-gray-100 rounded-2xl shadow-2xl text-center">
        <div className="mb-6 flex flex-col items-center">
          <LoadingSpinner size={40} className="mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upgrading AI Audit...</h2>
          <p className="text-gray-500 text-sm">
            Please wait while we generate your custom prompts and run a real-time baseline scan across ChatGPT, Gemini, and Claude.
          </p>
        </div>
        
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <p className="text-lg font-bold text-emerald-600 animate-pulse">{progress}%</p>
      </div>
    </div>
  );
}