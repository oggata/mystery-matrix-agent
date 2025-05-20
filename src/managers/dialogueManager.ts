import { logger } from '../utils/logger.js';

/**
 * 対話の整合性を管理するクラス
 */
export class DialogueManager {
  private dialogueHistory: Map<string, Array<{
    dialogue: string;
    emotion: string;
    topics: string[];
    timestamp: number;
  }>> = new Map();
  private dialogueContext: Map<string, {
    lastTopic: string | null;
    lastEmotion: string | null;
    lastHints: string[];
    timestamp: number | null;
  }> = new Map();

  /**
   * 対話のインタラクションを記録
   */
  recordDialogue(
    characterId: string, 
    dialogue: string, 
    emotion: string, 
    topics: string[] = []
  ): void {
    if (!this.dialogueHistory.has(characterId)) {
      this.dialogueHistory.set(characterId, []);
    }
    
    const history = this.dialogueHistory.get(characterId)!;
    history.push({
      dialogue,
      emotion,
      topics,
      timestamp: Date.now()
    });
    
    this.dialogueHistory.set(characterId, history);
  }

  /**
   * キャラクターの対話履歴を取得
   */
  getDialogueHistory(characterId: string): Array<{
    dialogue: string;
    emotion: string;
    topics: string[];
    timestamp: number;
  }> {
    return this.dialogueHistory.get(characterId) || [];
  }

  /**
   * キャラクターの対話コンテキストを取得
   */
  getDialogueContext(characterId: string): {
    lastTopic: string | null;
    lastEmotion: string | null;
    lastHints: string[];
    timestamp: number | null;
  } {
    return this.dialogueContext.get(characterId) || {
      lastTopic: null,
      lastEmotion: null,
      lastHints: [],
      timestamp: null
    };
  }

  /**
   * キャラクターの対話コンテキストを更新
   */
  updateDialogueContext(
    characterId: string, 
    context: {
      lastTopic?: string | null;
      lastEmotion?: string | null;
      lastHints?: string[];
      timestamp?: number | null;
    }
  ): void {
    const currentContext = this.getDialogueContext(characterId);
    
    this.dialogueContext.set(characterId, {
      ...currentContext,
      ...context
    });
    
    // この対話を記録
    this.recordDialogue(
      characterId,
      "Dialogue content", // 実際の対話内容に置き換える必要あり
      context.lastEmotion || currentContext.lastEmotion || "neutral",
      context.lastTopic ? [context.lastTopic] : []
    );
  }
}