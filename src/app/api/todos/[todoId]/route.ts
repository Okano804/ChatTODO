import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * PATCH /api/todos/[todoId] - TODOを完了/未完了に切り替え
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }  // Promise型に変更
) {
  try {
    const { is_completed } = await request.json();
    const { todoId } = await params;  // await を追加

    const { data, error } = await supabase
      .from('todos')
      .update({ 
        is_completed
        // updated_at を削除（カラムが存在しないため）
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
  { params }: { params: Promise<{ todoId: string }> }  // Promise型に変更
) {
  try {
    const { task_content, deadline } = await request.json();
    const { todoId } = await params;  // await を追加

    const { data, error } = await supabase
      .from('todos')
      .update({ 
        task_content,
        deadline
        // updated_at を削除（カラムが存在しないため）
      })
      .eq('id', todoId)
      .select()
      .single();

    if (error) throw error;

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
  { params }: { params: Promise<{ todoId: string }> }  // Promise型に変更
) {
  try {
    const { todoId } = await params;  // await を追加

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