import { GameState, Story } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * ゲーム状態の整合性を管理するクラス
 */
export class GameStateManager {
  private lastValidState: GameState | null = null;
  private consistencyChecks: Map<string, (gameState: GameState, story: Story) => string[]> = new Map();

  constructor() {
    this.initializeConsistencyChecks();
  }

  /**
   * 整合性チェック関数を初期化
   */
  private initializeConsistencyChecks(): void {
    // ストーリーの整合性チェック
    this.consistencyChecks.set('story', (gameState, story) => {
      const issues: string[] = [];
      
      // 現在のシーンが存在するか
      if (!story.story_arc.find(scene => scene.scene_id === gameState.current_scene)) {
        issues.push(`現在のシーン "${gameState.current_scene}" がストーリーに存在しません`);
      }
      
      // 手がかりの整合性
      for (const clueId of gameState.discovered_clues) {
        if (!story.clues.find(clue => clue.id === clueId || clue.name === clueId)) {
          issues.push(`手がかり "${clueId}" がストーリーに存在しません`);
        }
      }
      
      return issues;
    });

    // キャラクターの整合性チェック
    this.consistencyChecks.set('characters', (gameState, story) => {
      const issues: string[] = [];
      
      // 出会ったキャラクターの整合性
      if (gameState.game_progress.met_characters) {
        for (const charId of gameState.game_progress.met_characters) {
          if (!story.characters.find(char => char.id === charId || char.name === charId)) {
            issues.push(`出会ったキャラクター "${charId}" がストーリーに存在しません`);
          }
        }
      }
      
      return issues;
    });

    // アイテムの整合性チェック
    this.consistencyChecks.set('items', (gameState, story) => {
      const issues: string[] = [];
      
      // インベントリの整合性
      for (const item of gameState.inventory) {
        let itemExists = false;
        for (const location of story.locations) {
          if (location.items && location.items.includes(item)) {
            itemExists = true;
            break;
          }
        }
        if (!itemExists) {
          issues.push(`アイテム "${item}" がストーリーに存在しません`);
        }
      }
      
      return issues;
    });

    // ロケーションの整合性チェック
    this.consistencyChecks.set('locations', (gameState, story) => {
      const issues: string[] = [];
      
      // 現在のロケーションの整合性
      const currentLocation = story.locations.find(loc => 
        loc.id === gameState.current_scene || 
        (loc.connected_locations && loc.connected_locations.includes(gameState.current_scene))
      );
      
      if (!currentLocation) {
        issues.push(`現在のロケーション "${gameState.current_scene}" がストーリーに存在しません`);
      }
      
      return issues;
    });
  }

  /**
   * 現在の状態を最後の有効な状態として保存
   */
  saveLastValidState(gameState: GameState): void {
    this.lastValidState = JSON.parse(JSON.stringify(gameState));
  }

  /**
   * 現在のゲーム状態の整合性をチェック
   */
  checkConsistency(gameState: GameState, story: Story): {
    isConsistent: boolean;
    issues: string[];
    checkResults: Record<string, string[]>;
  } {
    const allIssues: string[] = [];
    const checkResults: Record<string, string[]> = {};

    // 各整合性チェックを実行
    for (const [checkName, checkFunction] of this.consistencyChecks.entries()) {
      const issues = checkFunction(gameState, story);
      if (issues.length > 0) {
        checkResults[checkName] = issues;
        allIssues.push(...issues);
      }
    }

    return {
      isConsistent: allIssues.length === 0,
      issues: allIssues,
      checkResults: checkResults
    };
  }

  /**
   * 現在の状態が整合性を持たない場合、最後の有効な状態に戻す
   */
  ensureConsistency(gameState: GameState, story: Story): GameState {
    const consistencyResult = this.checkConsistency(gameState, story);
    
    if (!consistencyResult.isConsistent) {
      logger.warn("ゲーム状態の整合性エラーを検出:", consistencyResult.issues);
      
      if (this.lastValidState) {
        logger.info("最後の有効な状態に戻します");
        return this.lastValidState;
      }
    }
    
    // 現在の状態が整合性を保っている場合、それを保存
    this.saveLastValidState(gameState);
    return gameState;
  }
}