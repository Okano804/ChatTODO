import { NextResponse } from 'next/server';
import { extractTodoWithGemini } from '@/lib/gemini';

/**
 * Gemini APIのテスト用エンドポイント
 * GET /api/test-gemini にアクセスすると実行される
 */
export async function GET() {
  try {
    // テストメッセージ
    const testMessages = [
      "明日の15時までに報告書を提出する",
      "来週の月曜日の午前中に会議資料を準備",
      "今日の18時までにメールを送る",
      "12月20日の10時までに見積書を作成"
    ];

    const results = [];

    // 各メッセージをテスト
    for (const message of testMessages) {
      const result = await extractTodoWithGemini(message);
      results.push({
        input: message,
        output: result
      });
    }

    return NextResponse.json({
      success: true,
      results: results
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}