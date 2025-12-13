'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/types';

interface UserSetupProps {
  onUserSet: (user: User) => void;
}

export function UserSetup({ onUserSet }: UserSetupProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      alert('名前とメールアドレスを入力してください');
      return;
    }

    const user: User = { 
      name: name.trim(), 
      email: email.trim() 
    };
    
    // ローカルストレージに保存
    localStorage.setItem('user', JSON.stringify(user));
    
    // 親コンポーネントに通知
    onUserSet(user);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>👤 ユーザー情報を入力</CardTitle>
        <CardDescription>
          TODO管理を始めるために、あなたの情報を教えてください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="名前（例: 山田太郎）"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Input
              type="email"
              placeholder="メールアドレス（例: yamada@company.com）"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            保存して開始
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}