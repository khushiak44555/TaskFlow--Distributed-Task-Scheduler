'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Clock, RotateCcw, AlertCircle } from 'lucide-react';

export default function ExecutionsPage() {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['executions', selectedStatus, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      const response = await api.get(`/api/jobs?${params}`);
      return response.data;
    }
  });

  const statusColors: Record<string, string> = {
    PENDING: 'text-yellow-500',
    RUNNING: 'text-blue-500',
    COMPLETED: 'text-green-500',
    FAILED: 'text-red-500',
    RETRY: 'text-orange-500',
    DEAD_LETTER: 'text-purple-500'
  };

  const statusIcons: Record<string, any> = {
    PENDING: Clock,
    RUNNING: RotateCcw,
    COMPLETED: CheckCircle2,
    FAILED: XCircle,
    RETRY: AlertCircle,
    DEAD_LETTER: XCircle
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Job Executions</h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRY', 'DEAD_LETTER'].map((status) => (
          <Button
            key={status}
            variant={selectedStatus === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedStatus(status);
              setPage(1);
            }}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ')}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {data?.executions?.map((execution: any) => {
          const StatusIcon = statusIcons[execution.status] || Clock;
          return (
            <Card key={execution.id} className="glass">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-5 w-5 ${statusColors[execution.status]}`} />
                      <div>
                        <h3 className="text-lg font-semibold">{execution.task?.name || 'Unknown Task'}</h3>
                        <p className="text-sm text-muted-foreground">
                          Execution ID: {execution.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className={`font-semibold ${statusColors[execution.status]}`}>
                          {execution.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Task Type</p>
                        <p className="font-medium">{execution.task?.type || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Attempts</p>
                        <p className="font-medium">{execution.attempts}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-medium">
                          {execution.duration ? `${execution.duration}ms` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Started At</p>
                        <p>{execution.startedAt ? new Date(execution.startedAt).toLocaleString() : 'Not started'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Completed At</p>
                        <p>{execution.completedAt ? new Date(execution.completedAt).toLocaleString() : 'Not completed'}</p>
                      </div>
                    </div>

                    {execution.error && (
                      <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-xs text-muted-foreground mb-1">Error</p>
                        <p className="text-sm text-destructive font-mono">{execution.error}</p>
                      </div>
                    )}

                    {execution.result && (
                      <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-md">
                        <p className="text-xs text-muted-foreground mb-1">Result</p>
                        <pre className="text-sm font-mono overflow-x-auto">
                          {JSON.stringify(execution.result, null, 2)}
                        </pre>
                      </div>
                    )}

                    {execution.retries && execution.retries.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground mb-2">Retry History ({execution.retries.length})</p>
                        <div className="space-y-2">
                          {execution.retries.map((retry: any, idx: number) => (
                            <div key={retry.id} className="text-sm p-2 bg-secondary/50 rounded">
                              <div className="flex justify-between">
                                <span>Attempt #{idx + 1}</span>
                                <span className="text-muted-foreground">
                                  {new Date(retry.attemptedAt).toLocaleString()}
                                </span>
                              </div>
                              {retry.error && (
                                <p className="text-xs text-destructive mt-1">{retry.error}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {data?.executions?.length === 0 && (
          <Card className="glass">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No executions found.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {data?.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
