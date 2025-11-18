import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  variant?: 'black' | 'white';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}

export default function Logo({ variant = 'black', size = 'md', href = '/' }: LogoProps) {
  const sizes = {
    sm: { width: 80, height: 24 },
    md: { width: 120, height: 36 },
    lg: { width: 160, height: 48 },
  };

  const logoSrc = variant === 'white' ? '/images/logo-white.png' : '/logo.png';
  const { width, height } = sizes[size];

  const logoImage = (
    <Image
      src={logoSrc}
      alt="Loquia"
      width={width}
      height={height}
      priority
      className="object-contain"
    />
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {logoImage}
      </Link>
    );
  }

  return <div className="flex items-center">{logoImage}</div>;
}
