import { Wallet, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-4 py-3">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center space-x-2">
          <Wallet className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold text-foreground">CryptoPort</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-xs hover:text-primary"
          >
            <a
              href="https://t.me/maiga_ai_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1"
            >
              <Sparkles className="h-3 w-3" />
              <span>Maiga AI</span>
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
