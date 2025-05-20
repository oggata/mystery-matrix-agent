import { Character } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * キャラクターの整合性を管理するクラス
 */
export class CharacterManager {
  private characters: Record<string, Character> = {};
  private characterTraits: Map<string, {
    personality: string;
    relationships: Record<string, string>;
    knowledge: string[];
    secrets: string[];
  }> = new Map();
  private characterHistory: Map<string, Array<{
    action: string;
    details: string;
    timestamp: number;
  }>> = new Map();

  /**
   * キャラクターデータを設定
   */
  setCharacters(characters: Character[]): void {
    this.characters = {};
    for (const character of characters) {
      this.characters[character.id] = character;
      this.characterTraits.set(character.id, {
        personality: character.personality,
        relationships: character.relationships,
        knowledge: character.knowledge,
        secrets: character.secrets
      });
      this.characterHistory.set(character.id, []);
    }
  }

  /**
   * キャラクターとのインタラクションを記録
   */
  trackInteraction(characterId: string, action: string, details: string): void {
    if (!this.characterHistory.has(characterId)) {
      this.characterHistory.set(characterId, []);
    }
    
    const history = this.characterHistory.get(characterId)!;
    history.push({
      action,
      details,
      timestamp: Date.now()
    });
    
    this.characterHistory.set(characterId, history);
  }

  /**
   * キャラクターのインタラクション履歴を取得
   */
  getInteractionHistory(characterId: string): Array<{
    action: string;
    details: string;
    timestamp: number;
  }> {
    return this.characterHistory.get(characterId) || [];
  }

  /**
   * キャラクターが関係レベルに基づいて知識を明かすかどうかを確認
   */
  wouldRevealKnowledge(
    characterId: string, 
    knowledgeItem: string, 
    relationshipLevel: number
  ): boolean {
    const character = this.characters[characterId];
    if (!character) return false;
    
    // キャラクターがこの情報を知っているかどうかを確認
    if (!character.knowledge.includes(knowledgeItem)) return false;
    
    // 高い関係レベルが必要な秘密かどうかを確認
    const isSecret = character.secrets.includes(knowledgeItem);
    
    if (isSecret && relationshipLevel < 4) {
      return false;
    }
    
    return true;
  }

  /**
   * キャラクターIDまたは名前からキャラクターを取得
   */
  getCharacter(idOrName: string): Character | null {
    // IDで検索
    if (this.characters[idOrName]) {
      return this.characters[idOrName];
    }
    
    // 名前で検索
    for (const id in this.characters) {
      if (this.characters[id].name === idOrName) {
        return this.characters[id];
      }
    }
    
    return null;
  }
}