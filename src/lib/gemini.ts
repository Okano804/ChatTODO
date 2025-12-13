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

    const prompt = `現在の日本時間: ${currentDateTime}

以下のメッセージからTODOのタスク内容と期限（日本時間）を抽出してください。

メッセージ: "${message}"

必ず以下のJSON形式のみで返してください（他の文章や説明は不要）:
{"task": "タスク内容", "deadline": "YYYY-MM-DD HH:MM:SS"}

例:
入力: "明日の15時までに報告書を提出"
出力: {"task": "報告書を提出", "deadline": "2025-12-14 15:00:00"}

入力: "来週の月曜日の午前中に会議資料を準備"
出力: {"task": "会議資料を準備", "deadline": "2025-12-16 12:00:00"}

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