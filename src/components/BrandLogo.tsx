import { Cloud } from 'lucide-react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BrandLogo({ size = 'md', className = '' }: BrandLogoProps) {
  const sizes = {
    sm: { icon: 'h-6 w-6', text: 'text-lg' },
    md: { icon: 'h-8 w-8', text: 'text-xl' },
    lg: { icon: 'h-10 w-10', text: 'text-2xl' },
  };

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Cloud className={`${sizes[size].icon} text-cyan-500`} />
      <span className={`${sizes[size].text} font-bold`}>
        <span className="text-cyan-500">Cloud</span>
        <span className="text-violet-500">Share</span>
      </span>
    </span>
  );
}
