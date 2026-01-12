'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ListTodo, 
  Activity, 
  AlertCircle, 
  BarChart3,
  Zap
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', href: '/dashboard/tasks', icon: ListTodo },
  { name: 'Executions', href: '/dashboard/executions', icon: Activity },
  { name: 'Dead Letter Queue', href: '/dashboard/dlq', icon: AlertCircle },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-card border-r">
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <Zap className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold">TaskFlow</span>
      </div>
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
