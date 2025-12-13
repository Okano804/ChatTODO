'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, ChatMessage } from '@/types';
import { Loader2, Sparkles } from 'lucide-react';

interface ChatInterfaceProps {
  user: User;
  onTodoAdded: () => void;
}

export function ChatInterface({ user, onTodoAdded }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    addMessage('assistant', `こんにちは、${user.name}さん！✨\n\nGoogle Gemini AIがTODOの管理をお手伝いします。\n\n例: 「明日の15時までに報告書を提出」と入力してください。`);
  }, [user.name]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      // Gemini APIでTODO抽出
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      const chatData = await chatResponse.json();

      if (!chatData.success) {
        addMessage('assistant', chatData.message || 'エラーが発生しました');
        setIsLoading(false);
        return;
      }

      // データベースに保存
      const todoResponse = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_name: user.name,
          creator_email: user.email,
          task_content: chatData.data.task,
          deadline: chatData.data.deadline
        })
      });

      if (todoResponse.ok) {
        const deadline = new Date(chatData.data.deadline).toLocaleString('ja-JP', {
          timeZone: 'Asia/Tokyo'
        });
        
        addMessage('assistant', 
          `✅ TODOを追加しました！\n\nタスク: ${chatData.data.task}\n期限: ${deadline}`
        );
        
        onTodoAdded();
      } else {
        addMessage('assistant', '❌ TODOの保存に失敗しました');
      }
    } catch (error) {
      console.error('Error:', error);
      addMessage('assistant', '❌ エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          Gemini AIチャット
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-64 overflow-y-auto space-y-2 p-4 bg-gray-50 rounded-lg">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white ml-auto max-w-[80%]'
                    : 'bg-white border max-w-[80%]'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Gemini AIが処理中...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="例: 明日の15時までに報告書を提出"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              送信
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}