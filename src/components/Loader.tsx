// Loader del Campus Duomo: animación de birrete
import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  size?: number;
  className?: string;
  label?: string;
  fullscreen?: boolean;
}

export function Loader({ size = 56, className, label, fullscreen }: LoaderProps) {
  const inner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <span
          className="absolute inset-0 rounded-full bg-[#ce8f88]/20 animate-ping"
        />
        <GraduationCap
          className="relative text-[#ce8f88] animate-bounce"
          style={{ width: size, height: size }}
          strokeWidth={1.75}
        />
      </div>
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        {inner}
      </div>
    );
  }
  return inner;
}

export default Loader;
