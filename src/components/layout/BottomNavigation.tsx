'use client';

import { Home, Star, User } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      id: 'market',
      label: 'Market',
      icon: Home,
      path: '/market',
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: Star,
      path: '/',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/profile',
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-2 safe-area-pb">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`cursor-pointer flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors ${
                active
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-primary' : ''}`} />
              <span
                className={`text-xs mt-1 ${
                  active ? 'text-primary font-medium' : ''
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
