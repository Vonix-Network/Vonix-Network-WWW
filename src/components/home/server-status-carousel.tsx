/**
 * Server Status Carousel
 * Interactive component to toggle between multiple servers
 */

'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Globe, Users, Gamepad2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/enterprise-card';
import { Button } from '@/components/ui/enterprise-button';

interface Server {
  id: number;
  name: string;
  description: string | null;
  ipAddress: string;
  port: number;
  status: string;
  playersOnline: number;
  playersMax: number;
  version: string | null;
  modpackName: string | null;
}

interface ServerStatusCarouselProps {
  servers: Server[];
  isLoading?: boolean;
}

export function ServerStatusCarousel({ servers, isLoading = false }: ServerStatusCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!servers || servers.length === 0) {
    return (
      <Card variant="gradient" glow className="overflow-hidden">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No servers available</p>
        </CardContent>
      </Card>
    );
  }

  const currentServer = servers[currentIndex];
  const isOnline = currentServer.status === 'online';

  const nextServer = () => {
    setCurrentIndex((prev) => (prev + 1) % servers.length);
  };

  const prevServer = () => {
    setCurrentIndex((prev) => (prev - 1 + servers.length) % servers.length);
  };

  return (
    <Card variant="gradient" glow className="overflow-hidden">
      <CardContent className="p-8 space-y-6">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Gamepad2 className="h-5 w-5 text-brand-cyan" />
              <div>
                <p className="text-sm text-muted-foreground">Server Status</p>
                <h3 className="text-2xl font-bold">{currentServer.name}</h3>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 text-brand-cyan animate-spin" />
                  <span className="text-sm font-medium text-brand-cyan">
                    Updating...
                  </span>
                </>
              ) : (
                <>
                  <div 
                    className={`h-2.5 w-2.5 rounded-full ${
                      isOnline ? 'bg-success animate-pulse' : 'bg-error'
                    }`} 
                  />
                  <span className="text-sm font-medium">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {currentServer.description && (
          <p className="text-sm text-muted-foreground">
            {currentServer.description}
          </p>
        )}

        {/* Stats Grid */}
        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-center p-4 rounded-lg bg-white/5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-cyan" />
              <span className="text-sm">Players Online</span>
            </div>
            <span className="text-xl font-bold gradient-text">
              {isOnline ? `${currentServer.playersOnline}/${currentServer.playersMax}` : '0/0'}
            </span>
          </div>
          
          {currentServer.version && (
            <div className="flex justify-between items-center p-4 rounded-lg bg-white/5">
              <span className="text-sm">Version</span>
              <span className="text-xl font-bold gradient-text">{currentServer.version}</span>
            </div>
          )}

          {currentServer.modpackName && (
            <div className="flex justify-between items-center p-4 rounded-lg bg-white/5">
              <span className="text-sm">Modpack</span>
              <span className="text-lg font-semibold gradient-text">{currentServer.modpackName}</span>
            </div>
          )}
        </div>
        
        {/* Server IP */}
        <div className="pt-4 space-y-2">
          <p className="text-sm text-muted-foreground">Server IP</p>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
            <Globe className="h-4 w-4 text-brand-cyan" />
            <code className="text-brand-cyan font-mono">
              {currentServer.ipAddress}
              {currentServer.port !== 25565 && `:${currentServer.port}`}
            </code>
          </div>
        </div>

        {/* Navigation Controls */}
        {servers.length > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevServer}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {/* Pagination Dots */}
            <div className="flex items-center gap-2">
              {servers.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'w-8 bg-brand-cyan' 
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Go to server ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={nextServer}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Server Count Indicator */}
        {servers.length > 1 && (
          <div className="text-center text-sm text-muted-foreground">
            Server {currentIndex + 1} of {servers.length}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
