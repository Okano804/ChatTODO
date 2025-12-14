import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * PATCH /api/todos/[todoId] - TODOを完了/未完了に切り替え
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }
) {
  try {
    const { is_completed } = await request.json();
    const { todoId } = await params;

    const { data, error } = await supabase
      .from('todos')
      .update({ 
        is_completed
      })
      .eq('id', todoId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ todo: data });
  } catch (error: any) {
    console.error('PATCH /api/todos/[todoId] error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/todos/[todoId] - TODOの内容を更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }
) {
  try {
    const { task_content, deadline } = await request.json();
    const { todoId } = await params;

    const { data, error } = await supabase
      .from('todos')
      .update({ 
        task_content,
        deadline
      })
      .eq('id', todoId)
      .select()
      .single();

    if (error) throw error;

    console.log('PUT /api/todos/[todoId] success:', data);

    // ★ 期限超過チェックを追加 ★
    const now = new Date();
    const deadlineDate = new Date(data.deadline);

    if (deadlineDate < now && !data.is_completed) {
      console.log('Updated TODO is overdue, sending immediate notification...');
      
      // 非同期で通知送信
      import('@/lib/notification').then(({ sendOverdueNotification }) => {
        sendOverdueNotification(data.id);
      }).catch(err => {
        console.error('Failed to send overdue notification:', err);
      });
    }

    return NextResponse.json({ todo: data });
  } catch (error: any) {
    console.error('PUT /api/todos/[todoId] error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/todos/[todoId] - TODOを削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }
) {
  try {
    const { todoId } = await params;

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todoId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/todos/[todoId] error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}