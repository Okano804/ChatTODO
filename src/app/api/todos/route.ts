import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/todos - TODO一覧を取得
 * 
 * 動作：
 * 1. Supabaseから未完了のTODOを取得
 * 2. 期限の早い順に並べ替え
 * 3. JSON形式で返す
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('is_completed', { ascending: true })  // 未完了を先に
      .order('deadline', { ascending: true });  

    if (error) throw error;

    return NextResponse.json({ todos: data });
  } catch (error: any) {
    console.error('GET /api/todos error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/todos - 新しいTODOを作成
 * 
 * リクエストボディ：
 * {
 *   creator_name: string,
 *   creator_email: string,
 *   task_content: string,
 *   deadline: string (ISO 8601形式)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creator_name, creator_email, task_content, deadline } = body;

    // バリデーション
    if (!creator_name || !creator_email || !task_content || !deadline) {
      return NextResponse.json(
        { error: 'Missing required fields: creator_name, creator_email, task_content, deadline' },
        { status: 400 }
      );
    }

    // Supabaseに新しいTODOを挿入
    const { data, error } = await supabase
      .from('todos')
      .insert([{
        creator_name,
        creator_email,
        task_content,
        deadline
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('TODO created:', data);
    return NextResponse.json({ todo: data }, { status: 201 });
    
  } catch (error: any) {
    console.error('POST /api/todos error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}