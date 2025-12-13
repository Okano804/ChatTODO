export async function extractTodoWithGemini(message: string): Promise<{
  task: string;
  deadline: string;
} | null> {
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  try {
    const now = new Date();
    const currentDateTime = now.toLocaleString('ja-JP', { 
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    });

    const prompt = `現在の日本時間（JST, UTC+9）: ${currentDateTime}

以下のメッセージからTODOのタスク内容と期限を抽出してください。

メッセージ: "${message}"

重要な指示:
1. 期限は必ず日本時間（JST, UTC+9）で計算してください
2. "1分後"は現在時刻から1分後の日本時間です
3. "明日"は日本時間の翌日です
4. タイムゾーンは日本時間（JST）で統一してください

必ず以下のJSON形式のみで返してください（他の文章や説明は不要）:
{"task": "タスク内容", "deadline": "YYYY-MM-DD HH:MM:SS"}

例:
入力: "明日の15時までに報告書を提出"
出力: {"task": "報告書を提出", "deadline": "2025-12-14 15:00:00"}

入力: "1時間後にミーティング"
現在時刻が 2025-12-13 23:30:00 の場合
出力: {"task": "ミーティング", "deadline": "2025-12-14 00:30:00"}

期限が不明確な場合は null を返してください。
必ずJSON形式のみで返答してください。`;

    // Gemini API を直接呼び出し（v1beta版を使用）
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    // レスポンスの構造を確認
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Unexpected response structure:', data);
      throw new Error('Unexpected response from Gemini API');
    }
    
    const text = data.candidates[0].content.parts[0].text;
    console.log('Gemini response:', text);

    // JSONを抽出
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (parsed.task && parsed.deadline) {
          return {
            task: parsed.task,
            deadline: parsed.deadline
          };
        }
      } catch (e) {
        console.error('Failed to parse Gemini response:', e);
        console.error('Response text:', text);
      }
    }

    return null;
    
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to extract TODO with Gemini API');
  }
}