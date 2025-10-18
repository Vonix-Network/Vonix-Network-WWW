'use client';

import { useState } from 'react';
import { CryptoModal } from './crypto-modal';

interface DonationsPageClientProps {
  donationSettings: {
    solanaAddress?: string;
    bitcoinAddress?: string;
    ethereumAddress?: string;
    litecoinAddress?: string;
  };
  children: React.ReactNode;
}

export function DonationsPageClient({ donationSettings, children }: DonationsPageClientProps) {
  const [showCryptoModal, setShowCryptoModal] = useState(false);

  return (
    <>
      <div onClick={(e) => {
        // Check if the clicked element is the crypto button
        const target = e.target as HTMLElement;
        if (target.closest('[data-crypto-button]')) {
          e.preventDefault();
          setShowCryptoModal(true);
        }
      }}>
        {children}
      </div>
      
      <CryptoModal
        isOpen={showCryptoModal}
        onClose={() => setShowCryptoModal(false)}
        addresses={donationSettings}
      />
    </>
  );
}
