import { NextRequest, NextResponse } from 'next/server';
import { extractTodoWithGemini } from '@/lib/gemini';

/**
 * POST /api/chat - チャットメッセージを処理
 * 
 * リクエストボディ：
 * { message: string }
 * 
 * レスポンス（成功時）：
 * {
 *   success: true,
 *   data: { task: string, deadline: string }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('Chat message received:', message);

    // Gemini APIでTODO抽出
    const todoData = await extractTodoWithGemini(message);

    if (!todoData) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'TODOの内容を理解できませんでした。「明日の15時までに報告書を提出」のように、期限を含めて入力してください。' 
        },
        { status: 400 }
      );
    }

    // デバッグ用：元のdeadline
    console.log('Original deadline from Gemini:', todoData.deadline);

    // Gemini AIの返す時刻が既に日本時間（JST）の場合もUTCとして扱われる可能性があるため
    // 明示的に日本時間として解釈し、ISO形式に変換
    try {
      // YYYY-MM-DD HH:MM:SS 形式をパース
      const deadlineStr = todoData.deadline;
      const [datePart, timePart] = deadlineStr.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute, second = 0] = timePart.split(':').map(Number);
      
      // 日本時間として日付を作成
      // JavaScriptのDateは月が0始まりなので -1
      const jstDate = new Date(year, month - 1, day, hour, minute, second);
      
      // ISO形式に変換（データベース用）
      // toISOString()はUTCに変換するので、日本時間のまま使うためにローカル時間で文字列化
      const jstYear = jstDate.getFullYear();
      const jstMonth = String(jstDate.getMonth() + 1).padStart(2, '0');
      const jstDay = String(jstDate.getDate()).padStart(2, '0');
      const jstHour = String(jstDate.getHours()).padStart(2, '0');
      const jstMinute = String(jstDate.getMinutes()).padStart(2, '0');
      const jstSecond = String(jstDate.getSeconds()).padStart(2, '0');
      
      // YYYY-MM-DD HH:MM:SS 形式で保存
      todoData.deadline = `${jstYear}-${jstMonth}-${jstDay} ${jstHour}:${jstMinute}:${jstSecond}`;
      
      console.log('Processed deadline (JST):', todoData.deadline);
    } catch (error) {
      console.error('Failed to process deadline:', error);
      // エラーでも続行（元のdeadlineを使用）
    }

    console.log('TODO extracted:', todoData);

    return NextResponse.json({
      success: true,
      data: todoData
    });
    
  } catch (error: any) {
    console.error('POST /api/chat error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}