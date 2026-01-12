'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Play, Pause, Trash2, Edit2, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'ONE_TIME',
    scheduledAt: '',
    priority: 5,
    payload: '{}',
    maxRetries: 3,
    timeout: 30000
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/api/tasks');
      return response.data;
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        payload: JSON.parse(data.payload || '{}'),
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : undefined
      };
      return await api.post('/api/tasks', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Success', description: 'Task created successfully' });
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        type: 'ONE_TIME',
        scheduledAt: '',
        priority: 5,
        payload: '{}',
        maxRetries: 3,
        timeout: 30000
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create task',
        variant: 'destructive'
      });
    }
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await api.patch(`/api/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Success', description: 'Task status updated' });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Success', description: 'Task deleted successfully' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate(formData);
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
        <h1 className="text-3xl font-bold">Tasks</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      {showCreateForm && (
        <Card className="glass">
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Task Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Task Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="ONE_TIME">One Time</option>
                    <option value="RECURRING">Recurring</option>
                    <option value="DELAYED">Delayed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Scheduled At</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority (0-10)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxRetries">Max Retries</Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.maxRetries}
                    onChange={(e) => setFormData({ ...formData, maxRetries: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payload">Payload (JSON)</Label>
                <textarea
                  id="payload"
                  value={formData.payload}
                  onChange={(e) => setFormData({ ...formData, payload: e.target.value })}
                  className="w-full h-24 px-3 py-2 rounded-md border border-input bg-background font-mono text-sm"
                  placeholder='{"key": "value"}'
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createTaskMutation.isPending}>
                  {createTaskMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Task
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {tasks?.tasks?.map((task: any) => (
          <Card key={task.id} className="glass">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{task.name}</h3>
                  {task.description && (
                    <p className="text-muted-foreground mt-1">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Type: {task.type}</span>
                    </div>
                    <div>
                      Status: <span className={`font-semibold ${task.status === 'ACTIVE' ? 'text-green-500' : 'text-yellow-500'}`}>
                        {task.status}
                      </span>
                    </div>
                    <div>Priority: {task.priority}</div>
                    <div>Executions: {task._count?.executions || 0}</div>
                  </div>
                  {task.scheduledAt && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Scheduled: {new Date(task.scheduledAt).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  {task.status === 'ACTIVE' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTaskStatusMutation.mutate({ id: task.id, status: 'PAUSED' })}
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTaskStatusMutation.mutate({ id: task.id, status: 'ACTIVE' })}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this task?')) {
                        deleteTaskMutation.mutate(task.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {tasks?.tasks?.length === 0 && (
          <Card className="glass">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No tasks found. Create your first task to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
