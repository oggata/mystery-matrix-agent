import { Story, GameState } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * ストーリーの整合性を管理するクラス
 */
export class StoryManager {
  private story: Story | null = null;
  private storyTimeline: Map<string, {
    description: string;
    requiredClues: string[];
    nextScenes: string[];
    availableActions: string[];
  }> = new Map();
  private lastUpdate: number | null = null;

  /**
   * ストーリーデータを設定
   */
  setStory(story: Story): void {
    this.story = story;
    this.buildStoryTimeline();
    this.lastUpdate = Date.now();
  }

  /**
   * ストーリー進行のタイムラインを構築
   */
  private buildStoryTimeline(): void {
    if (!this.story || !this.story.story_arc) return;
    
    // シーン遷移のグラフを作成
    this.storyTimeline.clear();
    
    for (const scene of this.story.story_arc) {
      this.storyTimeline.set(scene.scene_id, {
        description: scene.description,
        requiredClues: scene.required_clues || [],
        nextScenes: scene.next_scenes || [],
        availableActions: scene.available_actions || []
      });
    }
  }

  /**
   * 現在の状態に基づいて次の論理的なシーンを決定
   */
  getNextScene(
    currentScene: string, 
    discoveredClues: string[], 
    gameProgress: Record<string, any>
  ): string {
    if (!this.storyTimeline.has(currentScene)) return currentScene;
    
    const sceneInfo = this.storyTimeline.get(currentScene);
    
    if (!sceneInfo || !sceneInfo.nextScenes || sceneInfo.nextScenes.length === 0) {
      return currentScene;
    }
    
    // 次のシーンに必要な手がかりがすべて発見されているか確認
    for (const nextScene of sceneInfo.nextScenes) {
      const nextSceneInfo = this.storyTimeline.get(nextScene);
      
      if (!nextSceneInfo) continue;
      
      // 必要な手がかりがすべて発見されているか確認
      const allCluesDiscovered = nextSceneInfo.requiredClues.every(
        clue => discoveredClues.includes(clue)
      );
      
      if (allCluesDiscovered) {
        return nextScene;
      }
    }
    
    // 次のシーンに進めない場合は現在のシーンにとどまる
    return currentScene;
  }

  /**
   * ストーリーの整合性を検証
   */
  validateConsistency(gameState: GameState): string[] {
    if (!this.story) return ['Story is not set'];
    
    const issues: string[] = [];
    
    // シーンの存在を確認
    if (!this.storyTimeline.has(gameState.current_scene)) {
      issues.push(`Current scene "${gameState.current_scene}" does not exist in the story arc`);
    }
    
    // キャラクター参照を確認
    for (const charId in gameState.characters) {
      const character = this.story.characters.find(c => c.id === charId);
      if (!character) {
        issues.push(`Character "${charId}" referenced in game state does not exist in the story`);
      }
    }
    
    // ロケーション参照を確認
    for (const locId in gameState.locations) {
      const location = this.story.locations.find(l => l.id === locId);
      if (!location) {
        issues.push(`Location "${locId}" referenced in game state does not exist in the story`);
      }
    }
    
    return issues;
  }
}