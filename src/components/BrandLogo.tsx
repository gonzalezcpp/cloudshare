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
      <Cloud className={sizes[size].icon} style={{ color: '#2563EB' }} />
      <span className={`${sizes[size].text} font-bold tracking-tight ${dark ? 'text-white' : 'text-[#0f172a]'}`}>
        <span style={{ color: '#2563EB' }}>Cloud</span>
        <span style={{ color: '#7C3AED' }}>Share</span>
      </span>
    </span>
  );
}
