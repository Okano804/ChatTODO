import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * GET /api/notify - 期限超過TODOをメール通知
 * 
 * Vercel Cron Jobから自動実行される
 * または手動でアクセスしてテスト可能
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

    // 現在時刻（日本時間）
    const now = new Date();
    const jstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    
    // 期限超過TODOを取得
    const { data: overdueTodos, error } = await supabase
      .from('todos')
      .select('*')
      .eq('is_completed', false)
      .lt('deadline', jstNow.toISOString())
      .order('deadline', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log(`Found ${overdueTodos?.length || 0} overdue TODOs`);

    // 期限超過がなければ終了
    if (!overdueTodos || overdueTodos.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No overdue todos',
        count: 0 
      });
    }

    // メール本文を生成（HTML形式）
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .todo-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .todo-table th {
            background: #f3f4f6;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #e5e7eb;
          }
          .todo-table td {
            padding: 15px;
            border-bottom: 1px solid #e5e7eb;
          }
          .todo-table tr:last-child td {
            border-bottom: none;
          }
          .overdue {
            color: #dc2626;
            font-weight: 600;
          }
          .summary {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            border-left: 4px solid #dc2626;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚠️ 期限超過TODO通知</h1>
        </div>
        <div class="content">
          <p>以下のTODOが期限を超過しています：</p>
          
          <table class="todo-table">
            <thead>
              <tr>
                <th>タスク</th>
                <th>担当者</th>
                <th>期限</th>
              </tr>
            </thead>
            <tbody>
              ${overdueTodos.map(todo => {
                const deadline = new Date(todo.deadline);
                const formattedDeadline = deadline.toLocaleString('ja-JP', { 
                  timeZone: 'Asia/Tokyo',
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                return `
                  <tr>
                    <td><strong>${todo.task_content}</strong></td>
                    <td>${todo.creator_name}</td>
                    <td class="overdue">${formattedDeadline}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="summary">
            <p style="margin: 0;">
              <strong>合計：${overdueTodos.length} 件の期限超過TODOがあります</strong>
            </p>
          </div>

          <div class="footer">
            <p>このメールは自動送信されています</p>
            <h1>AI TODO管理アプリ - 【電話きたら500円】BY岡野</h1>
          </div>
        </div>
      </body>
      </html>
    `;

    // メール送信
const recipients = [process.env.BOSS_EMAIL!];
const creatorEmails = [...new Set(overdueTodos.map(t => t.creator_email))];
recipients.push(...creatorEmails);

console.log(`Sending email to: ${recipients.join(', ')}`);

const { data: emailData, error: sendError } = await resend.emails.send({
  from: 'TODO通知 <onboarding@resend.dev>',
  to: recipients,
  subject: `⚠️ 期限超過TODO通知 (${overdueTodos.length}件)`,
  html: emailHtml,
});

    if (sendError) {
      console.error('Resend error:', sendError);
      throw sendError;
    }

    console.log('Email sent successfully:', emailData?.id);

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      count: overdueTodos.length,
      emailId: emailData?.id,
      todos: overdueTodos.map(t => ({
        task: t.task_content,
        deadline: t.deadline,
        creator: t.creator_name
      }))
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