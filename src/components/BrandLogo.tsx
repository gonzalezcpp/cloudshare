import { Cloud } from 'lucide-react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  dark?: boolean;
}

export function BrandLogo({ size = 'md', dark = false }: BrandLogoProps) {
  const sizes = {
    sm: { icon: 'h-5 w-5', text: 'text-base' },
    md: { icon: 'h-6 w-6', text: 'text-lg' },
    lg: { icon: 'h-8 w-8', text: 'text-xl' },
  };

  return (
    <span className="inline-flex items-center gap-2">
      <Cloud className={sizes[size].icon} style={{ color: '#38bdf8' }} />
      <span className={cn(sizes[size].text, 'font-bold tracking-tight', dark ? 'text-white' : 'text-gray-900')}>
        <span style={{ color: '#38bdf8' }}>Cloud</span>
        <span style={{ color: '#a78bfa' }}>Share</span>
      </span>
    </span>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
