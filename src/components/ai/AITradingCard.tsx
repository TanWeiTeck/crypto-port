import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, TrendingUp, ExternalLink } from 'lucide-react';

export function AITradingCard() {
  return (
    <Card className="p-4 w-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Bot className="h-6 w-6 text-[#000a07]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold">Maiga AI Agent</h3>
                <Badge
                  variant="default"
                  className="bg-primary text-primary-foreground text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Decentralized AI Trading Assistant
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <p className="text-sm text-muted-foreground">
            Get AI-powered crypto trading insights, market analysis, and DeFAI
            signals directly on Telegram.
          </p>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span>Trading Signals</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>Market Analysis</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Bot className="h-3 w-3 text-primary" />
              <span>AI Insights</span>
            </div>
          </div>
        </div>

        <Button asChild className="w-full cursor-pointer font-semibold">
          <a
            href="https://t.me/maigaxbt_bot"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open AI Trading Bot
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
