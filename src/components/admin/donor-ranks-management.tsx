'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Users } from 'lucide-react';
import { DonorRanksClient } from '@/components/admin/donor-ranks-client';
import { UserRanksClient } from '@/components/admin/user-ranks-client';

interface DonationRank {
  id: string;
  name: string;
  minAmount: number;
  color: string;
  textColor: string;
  icon: string | null;
  badge: string | null;
  glow: boolean;
  duration: number;
  subtitle: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DonorRank extends DonationRank {
  userCount: number;
}

interface DonorRanksManagementProps {
  initialRanks: DonorRank[];
}

export function DonorRanksManagement({ initialRanks }: DonorRanksManagementProps) {
  const [activeTab, setActiveTab] = useState('ranks');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] bg-slate-900/50 border border-white/10">
          <TabsTrigger
            value="ranks"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-white"
          >
            <Crown className="h-4 w-4 mr-2" />
            Rank Configuration
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            User Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ranks" className="mt-6">
          <DonorRanksClient initialRanks={initialRanks} />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserRanksClient 
            initialRanks={initialRanks.map(rank => ({
              ...rank,
              badge: rank.badge ?? undefined,
              icon: rank.icon ?? undefined,
              subtitle: rank.subtitle ?? undefined,
            }))} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
