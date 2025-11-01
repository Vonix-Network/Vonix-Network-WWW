'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function SubscriptionCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-cyan-400" />
          Subscriptions & Donations
        </CardTitle>
        <CardDescription>
          Manage your recurring donations and donor ranks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            View and manage your active subscriptions, recurring donations, and automatically assigned donor ranks.
          </p>
          <div className="flex gap-3">
            <Link href="/settings/subscriptions" className="flex-1">
              <Button variant="outline" className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Subscriptions
              </Button>
            </Link>
            <Link href="/donations">
              <Button>
                <ArrowRight className="h-4 w-4 mr-2" />
                Make a Donation
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
