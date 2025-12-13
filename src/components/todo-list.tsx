'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Todo } from '@/types';
import { Clock, User, AlertCircle } from 'lucide-react';

interface TodoListProps {
  refreshTrigger: number;
}

export function TodoList({ refreshTrigger }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTodos();
  }, [refreshTrigger]);

  const loadTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      const data = await response.json();
      setTodos(data.todos || []);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  const getTimeUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    
    if (diff < 0) return '期限超過';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `残り${days}日`;
    } else if (hours > 0) {
      return `残り${hours}時間${minutes}分`;
    } else {
      return `残り${minutes}分`;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          読み込み中...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📋 TODO一覧</CardTitle>
      </CardHeader>
      <CardContent>
        {todos.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            TODOはまだありません
          </p>
        ) : (
          <div className="space-y-3">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={`p-4 rounded-lg border-l-4 ${
                  isOverdue(todo.deadline)
                    ? 'border-l-red-500 bg-red-50'
                    : 'border-l-blue-500 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      {todo.task_content}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{todo.creator_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(todo.deadline).toLocaleString('ja-JP', {
                            timeZone: 'Asia/Tokyo'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    {isOverdue(todo.deadline) ? (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        期限超過
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {getTimeUntilDeadline(todo.deadline)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}