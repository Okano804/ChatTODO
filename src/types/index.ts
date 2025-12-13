// TODOの型定義
export interface Todo {
  id: string;
  created_at: string;
  creator_name: string;
  creator_email: string;
  task_content: string;
  deadline: string;
  is_completed: boolean;
  notified_overdue: boolean;
  notified_1day: boolean;
  notified_6hour: boolean;
  notified_2hour: boolean;
  notified_1hour: boolean;
  notified_30min: boolean;
}

// ユーザーの型定義
export interface User {
  name: string;
  email: string;
}

// チャットメッセージの型定義
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Gemini APIから抽出されたTODO情報の型定義
export interface TodoExtraction {
  task: string;
  deadline: string;
}