'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BedrockMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  timestamp: number;
}

interface BedrockMetricsProps {
  metrics: BedrockMetrics[];
}

export function BedrockMetrics({ metrics }: BedrockMetricsProps) {
  if (metrics.length === 0) {
    return null;
  }

  const latestMetrics = metrics[metrics.length - 1];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">AWS Bedrock Metrics</CardTitle>
        <CardDescription className="text-xs">
          Latest conversation metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Exchange Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Input Tokens</p>
            <p className="text-2xl font-bold">{latestMetrics.inputTokens.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Output Tokens</p>
            <p className="text-2xl font-bold">{latestMetrics.outputTokens.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Tokens</p>
            <p className="text-2xl font-bold">{latestMetrics.totalTokens.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Latency</p>
            <p className="text-2xl font-bold">{latestMetrics.latencyMs}ms</p>
          </div>
        </div>

        {/* Conversation Summary */}
        {metrics.length > 1 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-3">
              Conversation Summary ({metrics.length} exchanges)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Input</p>
                <p className="text-lg font-semibold">
                  {metrics.reduce((sum, m) => sum + m.inputTokens, 0).toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Output</p>
                <p className="text-lg font-semibold">
                  {metrics.reduce((sum, m) => sum + m.outputTokens, 0).toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Avg Latency</p>
                <p className="text-lg font-semibold">
                  {Math.round(metrics.reduce((sum, m) => sum + m.latencyMs, 0) / metrics.length)}ms
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
