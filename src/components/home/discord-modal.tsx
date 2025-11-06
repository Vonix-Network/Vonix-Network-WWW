'use client';

import { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { LiveChat } from '@/components/chat/LiveChat';
import { Button } from '@/components/ui/enterprise-button';

interface DiscordModalProps {
  isOpen: boolean;
  onClose: () => void;
  discordInviteUrl?: string;
}

export function DiscordModal({ isOpen, onClose, discordInviteUrl = 'https://discord.gg/2zHpmcssFZ' }: DiscordModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Animated background effects */}
      <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-brand-cyan/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-6xl max-h-[90vh] overflow-hidden pointer-events-auto animate-in zoom-in-95 fade-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Card */}
          <div className="relative glass border-2 border-brand-cyan/40 rounded-3xl shadow-2xl shadow-brand-cyan/30 overflow-hidden hover:border-brand-cyan/50 transition-all">
            {/* Top glow effect */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-cyan to-transparent" />
            {/* Header */}
            <div className="relative px-6 py-5 flex items-center justify-between border-b-2 border-brand-cyan/20 bg-gradient-to-r from-brand-cyan/10 via-brand-blue/10 to-brand-purple/10 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 to-brand-purple/5 animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="relative z-10 flex items-center justify-between w-full">
                <div>
                  <h2 className="text-3xl font-bold gradient-text">Join Our Discord Community</h2>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    💬 Chat with players and stay connected
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Discord Join Button */}
                  <Button
                    variant="gradient"
                    size="lg"
                    asChild
                    className="shadow-xl shadow-brand-cyan/30 hover:shadow-brand-cyan/50 hover:scale-105 transition-all"
                  >
                    <a 
                      href={discordInviteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    Join Discord
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>

                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all text-muted-foreground hover:text-white hover:scale-110"
                    aria-label="Close modal"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content - Live Chat */}
            <div className="p-6">
              <LiveChat />
            </div>

            {/* Footer */}
            <div className="relative px-6 py-4 border-t-2 border-brand-cyan/20 bg-gradient-to-r from-brand-cyan/10 to-brand-purple/10 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-cyan/5 to-brand-purple/5" />
              <p className="relative z-10 text-sm text-center text-muted-foreground">
                💡 <span className="text-brand-cyan font-semibold">Tip:</span> Messages sent here are bridged to our Discord server
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
