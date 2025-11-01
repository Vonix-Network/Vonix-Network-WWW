import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ProfileSettings } from '@/components/settings/profile-settings';
import { AccountSettings } from '@/components/settings/account-settings';
import { SubscriptionCard } from '@/components/settings/subscription-card';
import UserBackgroundSelector from '@/components/settings/UserBackgroundSelector';
import { Settings as SettingsIcon } from 'lucide-react';

export const revalidate = 300; // Revalidate every 5 minutes

async function SettingsContent({ session }: { session: any }) {
  // Get user data
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, parseInt(session!.user.id)));

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in-up">
      {/* Header */}
      <div className="glass border border-green-500/20 rounded-2xl p-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-green-400" />
          <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-gray-400 mt-2">Manage your account and profile</p>
      </div>

      {/* Profile Settings */}
      <ProfileSettings user={user} />

      {/* Account Settings */}
      <AccountSettings user={user} />

      {/* Subscription Management */}
      <SubscriptionCard />

      {/* Background Preference */}
      <UserBackgroundSelector />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in-up">
      {/* Header Skeleton */}
      <div className="glass border border-green-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="h-6 w-48 bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Profile Settings Skeleton */}
      <div className="glass border border-green-500/20 rounded-2xl p-6">
        <div className="h-8 w-40 bg-gray-700 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="h-4 w-20 bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-10 w-full bg-gray-700 rounded animate-pulse" />
            </div>
            <div>
              <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-10 w-full bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <div>
            <div className="h-4 w-16 bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-24 w-full bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-700 rounded animate-pulse" />
        </div>
      </div>

      {/* Account Settings Skeleton */}
      <div className="glass border border-green-500/20 rounded-2xl p-6">
        <div className="h-8 w-48 bg-gray-700 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          <div>
            <div className="h-4 w-20 bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-10 w-full bg-gray-700 rounded animate-pulse" />
          </div>
          <div>
            <div className="h-4 w-28 bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-10 w-full bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="flex gap-4">
            <div className="h-10 w-32 bg-gray-700 rounded animate-pulse" />
            <div className="h-10 w-40 bg-red-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function SettingsPage() {
  const session = await getServerSession();

  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent session={session} />
    </Suspense>
  );
}
