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

    // Gemini APIでTODO情報を抽出
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