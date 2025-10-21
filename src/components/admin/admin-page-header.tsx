import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="glass border border-purple-500/20 rounded-2xl p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <Icon className="h-6 w-6 text-purple-400" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="gradient-text">{title}</span>
            </h1>
            {description && (
              <p className="text-gray-400 text-lg">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
