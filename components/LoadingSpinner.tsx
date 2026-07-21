import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <Loader2 
      className={`animate-spin text-emerald-600 ${className}`} 
      size={size} 
      aria-label="Loading..." 
    />
  );
}