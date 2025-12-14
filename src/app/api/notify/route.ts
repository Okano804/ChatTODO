import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendOverdueNotification } from '@/lib/notification';

/**
 * GET /api/notify - 期限超過TODOをメール通知
 * 
 * Vercel Cron Jobから自動実行される
 */
export async function GET(request: NextRequest) {
  try {
    // CRON_SECRETで認証（セキュリティ）
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    // 認証チェック（本番環境のみ）
    if (process.env.NODE_ENV === 'production' && authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Checking for overdue TODOs...');

    // 現在時刻
    const now = new Date();

    // 1分前の時刻
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    // 期限が1分以内に来て、未完了のTODOを取得
    const { data: overdueTodos, error } = await supabase
      .from('todos')
      .select('*')
      .eq('is_completed', false)
      .gte('deadline', oneMinuteAgo.toISOString())
      .lt('deadline', now.toISOString())
      .order('deadline', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log(`Found ${overdueTodos?.length || 0} newly overdue TODOs`);

    // 期限超過がなければ終了
    if (!overdueTodos || overdueTodos.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No newly overdue todos',
        count: 0 
      });
    }

    // 各TODOに対して個別に通知を送信
    for (const todo of overdueTodos) {
      await sendOverdueNotification(todo.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications sent successfully',
      count: overdueTodos.length
    });

  } catch (error: any) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        details: error 
      },
      { status: 500 }
    );
  }
}