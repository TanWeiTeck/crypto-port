'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Settings, Bell, Shield, HelpCircle } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export default function ProfilePage() {
  const { isConnected, address } = useAccount();

  return (
    <>
      {/* Profile Header */}
      <Card className="w-full p-4">
        <CardContent className="p-0 space-y-3 text-center">
          <div className="flex justify-end">
            <ConnectButton accountStatus="full" showBalance={false} />
          </div>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>

          {isConnected ? (
            <div>
              <h2 className="text-lg font-semibold mb-2">Connected Wallet</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : 'No address'}
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold mb-2">
                Connect Your Wallet
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Connect to view your profile and manage your portfolio
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coming Soon Section */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-muted-foreground">
            🚧 Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Profile features are under development
          </p>
          <Badge variant="outline" className="text-xs">
            Beta Version
          </Badge>
        </CardContent>
      </Card>

      {/* Future Features Preview */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Upcoming Features</h3>

        <div className="grid grid-cols-2 gap-3">
          <Card className="opacity-60">
            <CardContent className="p-4 text-center">
              <Settings className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <h4 className="text-sm font-medium">Settings</h4>
              <p className="text-xs text-muted-foreground">
                Preferences & Config
              </p>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardContent className="p-4 text-center">
              <Bell className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <h4 className="text-sm font-medium">Notifications</h4>
              <p className="text-xs text-muted-foreground">Price Alerts</p>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardContent className="p-4 text-center">
              <Shield className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <h4 className="text-sm font-medium">Security</h4>
              <p className="text-xs text-muted-foreground">Wallet Security</p>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardContent className="p-4 text-center">
              <HelpCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <h4 className="text-sm font-medium">Support</h4>
              <p className="text-xs text-muted-foreground">Help & FAQ</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* App Info */}
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <h4 className="text-sm font-medium mb-2">CryptoPort</h4>
          <p className="text-xs text-muted-foreground">
            Version 1.0.0 • Built with Next.js & Web3
          </p>
        </CardContent>
      </Card>
    </>
  );
}
