'use client';

import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface CryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: {
    solanaAddress?: string;
    bitcoinAddress?: string;
    ethereumAddress?: string;
    litecoinAddress?: string;
  };
}

export function CryptoModal({ isOpen, onClose, addresses }: CryptoModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const cryptos = [
    { 
      name: 'Solana', 
      symbol: 'SOL', 
      address: addresses.solanaAddress, 
      color: 'purple',
      icon: '◎'
    },
    { 
      name: 'Bitcoin', 
      symbol: 'BTC', 
      address: addresses.bitcoinAddress, 
      color: 'orange',
      icon: '₿'
    },
    { 
      name: 'Ethereum', 
      symbol: 'ETH', 
      address: addresses.ethereumAddress, 
      color: 'blue',
      icon: 'Ξ'
    },
    { 
      name: 'Litecoin', 
      symbol: 'LTC', 
      address: addresses.litecoinAddress, 
      color: 'gray',
      icon: 'Ł'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in">
      <div className="glass border border-green-500/20 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold gradient-text">Cryptocurrency Options</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {cryptos.map((crypto) => (
            <div 
              key={crypto.symbol} 
              className={`glass border border-${crypto.color}-500/20 rounded-xl p-4 hover:border-${crypto.color}-500/40 transition-all`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full bg-${crypto.color}-500/20 flex items-center justify-center text-2xl font-bold text-${crypto.color}-400`}>
                    {crypto.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{crypto.name}</h3>
                    <p className="text-sm text-gray-400">{crypto.symbol}</p>
                  </div>
                </div>
              </div>
              
              {crypto.address ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-slate-900/50 rounded text-sm text-green-400 break-all font-mono">
                      {crypto.address}
                    </code>
                    <button
                      onClick={() => copyToClipboard(crypto.address!, crypto.symbol)}
                      className={`px-3 py-2 rounded transition-all ${
                        copied === crypto.symbol
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                      }`}
                      title="Copy address"
                    >
                      {copied === crypto.symbol ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {copied === crypto.symbol && (
                    <p className="text-xs text-green-400 animate-in fade-in">✓ Copied to clipboard!</p>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                  <p className="text-gray-500 italic text-center">Not Setup</p>
                  <p className="text-xs text-gray-600 text-center mt-1">
                    Contact admin to configure this address
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-400 flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <span>
              <strong>Important:</strong> Always verify the address before sending. Cryptocurrency transactions are irreversible. 
              Double-check you're sending to the correct network (e.g., Bitcoin to Bitcoin address, not Ethereum).
            </span>
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover-lift glow-green"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
