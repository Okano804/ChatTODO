import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendOverdueNotification } from '@/lib/notification';

/**
 * GET /api/todos - TODO一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('is_completed', { ascending: true })
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
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creator_name, creator_email, task_content, deadline } = body;

    if (!creator_name || !creator_email || !task_content || !deadline) {
      return NextResponse.json(
        { error: 'Missing required fields: creator_name, creator_email, task_content, deadline' },
        { status: 400 }
      );
    }

    let utcDeadline = deadline;
    try {
      const [datePart, timePart] = deadline.split(' ');
      const jstIsoString = `${datePart}T${timePart}+09:00`;
      const date = new Date(jstIsoString);
      utcDeadline = date.toISOString();
      
      console.log('JST deadline:', deadline);
      console.log('JST ISO:', jstIsoString);
      console.log('UTC deadline:', utcDeadline);
    } catch (error) {
      console.error('Failed to convert deadline to UTC:', error);
    }

    const { data, error } = await supabase
      .from('todos')
      .insert([{
        creator_name,
        creator_email,
        task_content,
        deadline: utcDeadline
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('TODO created:', data);

    // 期限超過チェック
    const now = new Date();
    const deadlineDate = new Date(data.deadline);

    if (deadlineDate < now && !data.is_completed) {
      console.log('TODO is already overdue, sending immediate notification...');
      
      sendOverdueNotification(data.id).catch(err => {
        console.error('Failed to send overdue notification:', err);
      });
    }

    return NextResponse.json({ todo: data }, { status: 201 });
    
  } catch (error: any) {
    console.error('POST /api/todos error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}