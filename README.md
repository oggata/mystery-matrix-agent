

```markdown
# Mystery Matrix Agent

LangChain・LangGraphを使用した没入型アドベンチャーゲームエンジン

## 概要

Mystery Matrix Agentは、LangChainとLangGraphを活用したWebベースのアドベンチャーゲームエンジンです。
テキストベースのインタラクティブなナラティブ体験を提供し、プレイヤーはストーリーの謎を解き明かすために手がかりを集め、キャラクターと対話し、様々なアクションを実行することができます。

## 特徴

- OpenAI APIを利用した動的なストーリー生成
- プレイヤーのアクションに応じて進化するゲーム状態
- キャラクターとの会話システム
- 手がかりとインベントリの管理
- ゲーム状態の保存と読み込み
- LangGraphを使用した状態管理と遷移制御

## 構造

mystery-matrix-agent/
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── app.ts                   # エントリーポイント
│   ├── server.ts                # Expressサーバー
│   ├── types/
│   │   └── index.ts             # 型定義
│   ├── config/
│   │   └── config.ts            # 設定ファイル
│   ├── graph/
│   │   ├── index.ts             # グラフのメインエクスポート
│   │   ├── nodes/
│   │   │   ├── story.ts         # ストーリー生成ノード
│   │   │   ├── action.ts        # アクション処理ノード
│   │   │   ├── dialogue.ts      # ダイアログ処理ノード
│   │   │   ├── clue.ts          # 手がかり処理ノード
│   │   │   └── hint.ts          # ヒント生成ノード
│   │   └── edges.ts             # グラフのエッジ定義
│   ├── managers/
│   │   ├── storyManager.ts      # ストーリー整合性管理
│   │   ├── characterManager.ts  # キャラクター整合性管理
│   │   ├── dialogueManager.ts   # ダイアログ整合性管理
│   │   └── gameStateManager.ts  # ゲーム状態整合性管理
│   ├── models/
│   │   ├── gameState.ts         # ゲーム状態モデル
│   │   ├── story.ts             # ストーリーモデル
│   │   ├── character.ts         # キャラクターモデル
│   │   └── clue.ts              # 手がかりモデル
│   ├── utils/
│   │   ├── openai.ts            # OpenAI APIユーティリティ
│   │   ├── jsonParser.ts        # JSON解析ユーティリティ
│   │   └── logger.ts            # ロギングユーティリティ
│   └── public/
│       ├── index.html           # フロントエンドのHTMLファイル
│       ├── css/
│       │   └── style.css        # スタイルシート
│       └── js/
│           └── main.js          # フロントエンドのJavaScript
└── tests/
    └── graph.test.ts            # グラフテスト


## 技術スタック

- TypeScript
- LangChain / LangGraph
- Express.js
- OpenAI API

## セットアップ方法

### 前提条件

- Node.js (バージョン18以上)
- npm または yarn
- OpenAI APIキー

### インストール

1. リポジトリをクローン

```bash
git clone https://github.com/yourusername/mystery-matrix-agent.git
cd mystery-matrix-agent
```

2. 依存関係をインストール

```bash
npm install
```

または

```bash
yarn install
```

```bash
rm -rf node_modules package-lock.json
npm install

# yarnの場合
rm -rf node_modules yarn.lock
yarn install
```


3. 環境変数の設定

プロジェクトのルートに`.env`ファイルを作成し、以下の内容を設定します：

```
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
DEBUG_MODE=false
```

4. アプリケーションのビルド

```bash
npm run build
```

5. アプリケーションの起動

```bash
npm start
```

ブラウザで `http://localhost:3000` を開いて、アプリケーションにアクセスできます。

## 開発モード

開発中は、以下のコマンドを使用して、変更を監視しながらアプリケーションを実行できます：

```bash
npm run dev
```

## 使用方法

1. ブラウザでアプリケーションにアクセスします
2. OpenAI APIキーを入力して検証します
3. ゲームのテーマとキャラクター名を設定します
4. ストーリーが生成され、冒険を始めることができます
5. テキストコマンドや用意されたボタンを使用してゲームを進行します

## ルール・制約事項

- OpenAI APIの利用には制限があります。APIキーは慎重に管理してください。
- ゲーム状態はローカルストレージに保存されます。ブラウザのデータをクリアすると、保存されたゲームは失われます。
- このアプリケーションはあくまで個人的な利用を想定しています。商用利用には適切なライセンスが必要です。


```

これで、全てのファイルの実装が完了しました。このプロジェクトは、元のJavaScriptコードベースのアドベンチャーゲームエンジンをLangChainとLangGraphのエコシステムに移植し、TypeScriptで書き直したものです。(vanillajs/index.html)

## 使い方のまとめ

1. リポジトリをクローンしてパッケージをインストールします
2. `.env`ファイルにOpenAI APIキーを設定します
3. `npm run build`でプロジェクトをビルドします
4. `npm start`でアプリケーションを起動します
5. ブラウザで`http://localhost:3000`にアクセスします
6. APIキーを入力し、ゲームのテーマと主人公の名前を設定してゲームを作成します
7. テキストコマンドとUIを使ってゲームを進行します

各ノードは独立したLLM呼び出しで、LangGraphの状態管理によって協調動作します。状態の一貫性が保たれ、整合性マネージャーがエッジケースを処理します。このモジュール性により、新しい機能の追加やゲームロジックの拡張が容易になっています。