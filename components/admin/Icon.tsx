import * as LucideIcons from 'lucide-react';

type IconName = keyof typeof LucideIcons;

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  style?: React.CSSProperties;
  color?: string;
  className?: string;
}

export function Icon({
  name,
  size = 18,
  stroke = 2,
  style,
  color,
  className,
}: IconProps) {
  const Component = LucideIcons[name] as React.ComponentType<any>;

  if (!Component) {
    return null;
  }

  return (
    <Component
      size={size}
      strokeWidth={stroke}
      style={{ ...style, color }}
      className={className}
    />
  );
}
