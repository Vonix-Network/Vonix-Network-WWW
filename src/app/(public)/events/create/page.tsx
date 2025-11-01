import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CreateEventForm from './CreateEventForm';

export default async function CreateEventPage() {
  const session = await getServerSession();
  const role = (session?.user as any)?.role;
  const canCreate = role === 'admin' || role === 'moderator';
  if (!canCreate) {
    redirect('/events');
  }
  return <CreateEventForm />;
}
