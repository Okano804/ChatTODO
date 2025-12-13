# 📝 AI TODO管理アプリ

Google Gemini AI + Next.js + Supabaseで作成したTODO管理アプリ

## 🚀 機能

- ✅ Google Gemini AIでTODO自動抽出
- ✅ チャットインターフェース
- ✅ 期限順に一覧表示
- ✅ リアルタイム更新
- ✅ レスポンシブデザイン

## 🛠️ 技術スタック

- **AI**: Google Gemini API (gemini-2.5-flash)
- **フロントエンド**: Next.js 14, TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: Supabase PostgreSQL
- **UI**: shadcn/ui
- **アイコン**: lucide-react

## 📦 セットアップ

### 1. リポジトリをクローン
```bash
git clone https://github.com/Okano804/ChatTODO.git
cd ChatTODO
```

### 2. 依存関係をインストール
```bash
npm install
```

### 3. 環境変数を設定

`.env.local` ファイルを作成：
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 4. 開発サーバーを起動
```bash
npm run dev
```

http://localhost:3000 にアクセス

## 📖 使い方

1. 名前とメールアドレスを入力
2. チャットに「明日の15時までに報告書を提出」と入力
3. Gemini AIが自動的にタスクと期限を抽出
4. TODO一覧に追加される

## 📄 ライセンス

MIT