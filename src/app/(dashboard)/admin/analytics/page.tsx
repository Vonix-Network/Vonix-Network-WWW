import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb';
import { BarChart3 } from 'lucide-react';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function AnalyticsContent() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Analytics' }]} />

      <AdminPageHeader
        title="Analytics"
        description="System statistics and performance metrics"
        icon={BarChart3}
      />

      {/* Placeholder for future analytics */}
      <div className="glass border border-blue-500/20 rounded-2xl p-12 text-center">
        <BarChart3 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-400 mb-2">
          Analytics Coming Soon
        </h3>
        <p className="text-gray-500">
          Detailed analytics and reporting features will be available here.
        </p>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass border border-purple-500/20 rounded-2xl p-6 h-32 animate-pulse" />
      <div className="glass border border-blue-500/20 rounded-2xl p-12 h-64 animate-pulse" />
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsContent />
    </Suspense>
  );
}
