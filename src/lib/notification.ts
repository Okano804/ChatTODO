import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * 期限超過TODOのメール通知を送信
 */
export async function sendOverdueNotification(todoId: string) {
  try {
    // 該当TODOを取得
    const { data: todo, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', todoId)
      .single();

    if (fetchError || !todo) {
      console.error('Failed to fetch TODO:', fetchError);
      return { success: false, error: 'TODO not found' };
    }

    // 既に完了している場合はスキップ
    if (todo.is_completed) {
      return { success: false, error: 'TODO already completed' };
    }

    // メール本文を生成
    const deadline = new Date(todo.deadline);
    const formattedDeadline = deadline.toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

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
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
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
          .todo-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #dc2626;
            margin: 20px 0;
          }
          .todo-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .todo-info {
            color: #6b7280;
            margin: 5px 0;
          }
          .urgent {
            color: #dc2626;
            font-weight: 600;
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
          <h1>🚨 期限超過TODO通知</h1>
        </div>
        <div class="content">
          <p>以下のTODOが期限を超過しました：</p>
          
          <div class="todo-card">
            <div class="todo-title">${todo.task_content}</div>
            <div class="todo-info">担当者: ${todo.creator_name}</div>
            <div class="todo-info urgent">期限: ${formattedDeadline}</div>
          </div>

          <p style="margin-top: 20px;">
            早急に対応してください。
          </p>

          <div class="footer">
            <h1>【電話きたら500円】By岡野</h1>
          </div>
        </div>
      </body>
      </html>
    `;

    // メール送信先（上司のみ - Resend無料プランの制限のため）
    const recipients = [process.env.BOSS_EMAIL!];
    console.log(`Sending overdue notification for TODO: ${todo.task_content}`);
    console.log(`Recipients: ${recipients.join(', ')}`);

    const { data: emailData, error: sendError } = await resend.emails.send({
      from: 'TODO通知 <onboarding@resend.dev>',
      to: recipients,
      subject: `🚨 期限超過: ${todo.task_content}`,
      html: emailHtml,
    });

    if (sendError) {
      console.error('Failed to send email:', sendError);
      return { success: false, error: sendError };
    }

    console.log('Overdue notification sent successfully:', emailData?.id);

    return { success: true, emailId: emailData?.id };

  } catch (error: any) {
    console.error('Notification error:', error);
    return { success: false, error: error.message };
  }
}