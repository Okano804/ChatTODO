'use client';

import { useState, useEffect } from 'react';
import { UserSetup } from '@/components/user-setup';
import { ChatInterface } from '@/components/chat-interface';
import { TodoList } from '@/components/todo-list';
import { User } from '@/types';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleTodoAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 mt-16">
            【電話が来たら500円】 はよやれTODO
          </h1>
          <p className="text-2xl text-gray-600">
            By 岡野
          </p>
        </div>

        {!user ? (
          <UserSetup onUserSet={setUser} />
        ) : (
          <div className="flex flex-col gap-6 mt-16">
            <ChatInterface user={user} onTodoAdded={handleTodoAdded} />
            <TodoList refreshTrigger={refreshTrigger} />
          </div>
        )}
      </div>
    </main>
  );
}