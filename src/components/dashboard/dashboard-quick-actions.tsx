export function DashboardQuickActions() {
  return (
    <div className="glass border border-green-500/20 rounded-2xl p-6 hover-lift">
      <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction href="/social" label="Create Post" />
        <QuickAction href="/forum" label="Start Discussion" />
        <QuickAction href="/messages" label="Send Message" />
        <QuickAction href="/profile" label="Edit Profile" />
      </div>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="glass border border-green-500/20 hover:border-green-500/40 rounded-xl p-4 text-center font-medium text-white hover:text-green-400 transition-all hover-lift"
    >
      {label}
    </a>
  );
}

