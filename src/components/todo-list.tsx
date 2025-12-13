'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Todo } from '@/types';
import { Clock, User, AlertCircle, Check, X, Edit2, Trash2 } from 'lucide-react';

interface TodoListProps {
  refreshTrigger: number;
}

export function TodoList({ refreshTrigger }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState('');
  const [editDeadline, setEditDeadline] = useState('');

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

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !currentStatus })
      });

      if (response.ok) {
        loadTodos();
      }
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTask(todo.task_content);
    // ISO形式に変換（datetime-localで使用）
    const deadlineDate = new Date(todo.deadline);
    const localDatetime = new Date(deadlineDate.getTime() - deadlineDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setEditDeadline(localDatetime);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTask('');
    setEditDeadline('');
  };

  const saveEdit = async (id: string) => {
    try {
      // datetime-localの値をISO形式に変換
      const deadline = new Date(editDeadline).toISOString();

      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_content: editTask,
          deadline: deadline
        })
      });

      if (response.ok) {
        loadTodos();
        cancelEdit();
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    if (!confirm('このTODOを削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadTodos();
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
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
                className={`p-4 rounded-lg border-l-4 transition-all ${
                  todo.is_completed
                    ? 'border-l-green-500 bg-green-50 opacity-60'
                    : isOverdue(todo.deadline)
                    ? 'border-l-red-500 bg-red-50'
                    : 'border-l-blue-500 bg-white'
                }`}
              >
                {editingId === todo.id ? (
                  // 編集モード
                  <div className="space-y-3">
                    <Input
                      value={editTask}
                      onChange={(e) => setEditTask(e.target.value)}
                      placeholder="タスク内容"
                    />
                    <Input
                      type="datetime-local"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveEdit(todo.id)}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        保存
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={cancelEdit}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-1" />
                        キャンセル
                      </Button>
                    </div>
                  </div>
                ) : (
                  // 表示モード
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {/* 完了チェックボックス */}
                      <button
                        onClick={() => toggleComplete(todo.id, todo.is_completed)}
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          todo.is_completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {todo.is_completed && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </button>

                      <div className="flex-1">
                        <h3 className={`font-semibold text-lg mb-2 ${
                          todo.is_completed ? 'line-through text-gray-500' : ''
                        }`}>
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
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* ステータスバッジ */}
                      {todo.is_completed ? (
                        <Badge variant="default" className="bg-green-500">
                          完了
                        </Badge>
                      ) : isOverdue(todo.deadline) ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          期限超過
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {getTimeUntilDeadline(todo.deadline)}
                        </Badge>
                      )}

                      {/* アクションボタン */}
                      {!todo.is_completed && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(todo)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteTodo(todo.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}