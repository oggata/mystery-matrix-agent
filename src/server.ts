import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/config.js';
import { logger } from './utils/logger.js';
import { verifyApiKey } from './utils/openai.js';
import { 
  runGenerateStory, 
  runProcessAction, 
  runProcessDialogue, 
  runGenerateHint, 
  runAnalyzeClues 
} from './graph/index.js';
import { GameStateManager } from './managers/gameStateManager.js';
import { JsonParser } from './utils/jsonParser.js';
import { createEmptyGameState } from "./types/index.js";
// エクスプレスアプリの作成
const app = express();
const port = config.port;

// ミドルウェアの設定
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ゲーム状態マネージャーの作成
const gameStateManager = new GameStateManager();

// APIキー検証エンドポイント
app.post('/api/verify-api-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ success: false, message: 'APIキーが必要です' });
    }
    
    const isValid = await verifyApiKey(apiKey);
    
    if (isValid) {
      return res.json({ success: true, message: 'APIキーは有効です' });
    } else {
      return res.status(401).json({ success: false, message: '無効なAPIキーです' });
    }
  } catch (error) {
    logger.error('APIキー検証エラー:', error);
    return res.status(500).json({ 
      success: false, 
      message: `APIキーの検証中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
});

// ゲーム作成エンドポイント
app.post('/api/create-game', async (req, res) => {
  try {
    const { theme, playerName } = req.body;
    
    if (!theme) {
      return res.status(400).json({ success: false, message: 'テーマが必要です' });
    }
    
    // グラフを実行してストーリーを生成
    const result = await runGenerateStory({ 
      game_state: createEmptyGameState()
    }, theme, playerName || "Player");
    
    return res.json({ 
      success: true, 
      game_state: result.game_state,
      result: result.result
    });
  } catch (error) {
    logger.error('ゲーム作成エラー:', error);
    return res.status(500).json({ 
      success: false, 
      message: `ゲームの作成中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
});
// アクション処理エンドポイント
app.post('/api/process-action', async (req, res) => {
  try {
    const { action, target, gameState } = req.body;
    
    if (!action || !target || !gameState) {
      return res.status(400).json({ success: false, message: 'アクション、ターゲット、およびゲーム状態が必要です' });
    }
    
    // 整合性チェックのためにゲーム状態を保存
    gameStateManager.saveLastValidState(gameState);
    
    // グラフを実行してアクションを処理
    const result = await runProcessAction({ 
      game_state: gameState, 
      action: { type: action, target } 
    });
    
    // 整合性の確保
    const validatedState = gameStateManager.ensureConsistency(result.game_state, result.game_state.story_context);
    
    return res.json({ 
      success: true, 
      game_state: validatedState,
      result: result.result
    });
  } catch (error) {
    logger.error('アクション処理エラー:', error);
    return res.status(500).json({ 
      success: false, 
      message: `アクションの処理中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
});

// キャラクター対話エンドポイント
app.post('/api/character-dialogue', async (req, res) => {
  try {
    const { characterId, topic, gameState } = req.body;
    
    if (!characterId || !gameState) {
      return res.status(400).json({ success: false, message: 'キャラクターIDとゲーム状態が必要です' });
    }
    
    // グラフを実行して対話を処理
    const result = await runProcessDialogue({ 
      game_state: gameState, 
      character_id: characterId,
      topic
    });
    
    return res.json({ 
      success: true, 
      game_state: result.game_state,
      result: result.result
    });
  } catch (error) {
    logger.error('キャラクター対話エラー:', error);
    return res.status(500).json({ 
      success: false, 
      message: `キャラクターとの対話中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
});

// ヒント生成エンドポイント
app.post('/api/generate-hint', async (req, res) => {
  try {
    const { gameState, difficulty } = req.body;
    
    if (!gameState) {
      return res.status(400).json({ success: false, message: 'ゲーム状態が必要です' });
    }
    
    // グラフを実行してヒントを生成
    const result = await runGenerateHint({ 
      game_state: gameState, 
      difficulty: difficulty || 'normal'
    });
    
    return res.json({ 
      success: true, 
      game_state: result.game_state,
      result: result.result
    });
  } catch (error) {
    logger.error('ヒント生成エラー:', error);
    return res.status(500).json({ 
      success: false, 
      message: `ヒントの生成中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
});

// 手がかり分析エンドポイント
app.post('/api/analyze-clues', async (req, res) => {
  try {
    const { gameState } = req.body;
    
    if (!gameState) {
      return res.status(400).json({ success: false, message: 'ゲーム状態が必要です' });
    }
    
    // グラフを実行して手がかりを分析
    const result = await runAnalyzeClues({ 
      game_state: gameState
    });
    
    return res.json({ 
      success: true, 
      game_state: result.game_state,
      result: result.result
    });
  } catch (error) {
    logger.error('手がかり分析エラー:', error);
    return res.status(500).json({ 
      success: false, 
      message: `手がかりの分析中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
});

// ゲーム状態保存エンドポイント
app.post('/api/save-game', (req, res) => {
  try {
    const { gameState } = req.body;
    
    if (!gameState) {
      return res.status(400).json({ success: false, message: 'ゲーム状態が必要です' });
    }
    
    // JSONとして保存するための文字列を作成
    const savedState = JSON.stringify({
      gameState,
      timestamp: Date.now()
    });
    
    return res.json({ 
      success: true, 
      savedState
    });
  } catch (error) {
    logger.error('ゲーム保存エラー:', error);
    return res.status(500).json({ 
      success: false, 
      message: `ゲームの保存中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
});

// ゲーム状態読み込みエンドポイント
app.post('/api/load-game', (req, res) => {
  try {
    const { savedState } = req.body;
    
    if (!savedState) {
      return res.status(400).json({ success: false, message: '保存された状態が必要です' });
    }
    
    // 保存された状態を解析
    try {
      const parsed = JsonParser.parse(savedState);
      
      // 型安全のためにプロパティの存在を確認
      if (typeof parsed === 'object' && parsed !== null && 'gameState' in parsed) {
        return res.json({ 
          success: true, 
          gameState: parsed.gameState
        });
      } else {
        return res.status(400).json({
          success: false,
          message: '保存されたゲーム状態に必要なプロパティが含まれていません'
        });
      }
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: `保存されたゲーム状態の解析に失敗しました: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  } catch (error) {
    logger.error('ゲーム読み込みエラー:', error);
    return res.status(500).json({ 
      success: false, 
      message: `ゲームの読み込み中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
});

// メインのHTMLファイルを提供
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// サーバーのエクスポート
export const server = app;
export const startServer = () => {
  return app.listen(port, () => {
    logger.info(`サーバーが http://localhost:${port} で実行中`);
  });
};