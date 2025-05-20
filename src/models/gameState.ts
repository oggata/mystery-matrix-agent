import { GameState, Story, Character, Location, GameMessage } from '../types/index.js';

/**
 * 初期ゲーム状態の作成
 */
export function createInitialGameState(story: Story, playerName: string): GameState {
  // キャラクター辞書の作成
  const characters: Record<string, Character> = {};
  for (const character of story.characters) {
    characters[character.id] = character;
  }

  // ロケーション辞書の作成
  const locations: Record<string, Location> = {};
  for (const location of story.locations) {
    locations[location.id] = location;
  }

  // 初期メッセージの作成
  const initialMessages: GameMessage[] = [
    {
      type: 'system',
      content: `Welcome to "${story.title}", ${playerName}! Your adventure begins now...`
    }
  ];

  // 初期ゲーム状態の作成
  return {
    messages: initialMessages,
    current_scene: 'opening',
    inventory: [],
    discovered_clues: [],
    game_progress: {
      met_characters: []
    },
    available_actions: [],
    story_context: story,
    characters,
    locations,
    player_name: playerName
  };
}

/**
 * ゲーム状態をクローン
 */
export function cloneGameState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

/**
 * 新しいメッセージをゲーム状態に追加
 */
export function addMessageToGameState(state: GameState, message: GameMessage): GameState {
  const newState = cloneGameState(state);
  newState.messages.push(message);
  return newState;
}

/**
 * 新しい手がかりをゲーム状態に追加
 */
export function addClueToGameState(state: GameState, clueId: string): GameState {
  const newState = cloneGameState(state);
  
  // すでに手がかりが存在する場合は追加しない
  if (newState.discovered_clues.includes(clueId)) {
    return newState;
  }
  
  // 手がかりを追加
  newState.discovered_clues.push(clueId);
  
  // 手がかりの詳細を取得
  const clueDetails = newState.story_context.clues.find(
    clue => clue.id === clueId || clue.name === clueId
  );
  
  // 手がかり発見メッセージを追加
  newState.messages.push({
    type: 'system',
    content: `新しい手がかりを発見: ${clueDetails ? clueDetails.name : clueId}`,
    clue: true
  });
  
  return newState;
}

/**
 * 新しいアイテムをゲーム状態に追加
 */
export function addItemToGameState(state: GameState, item: string): GameState {
  const newState = cloneGameState(state);
  
  // すでにアイテムが存在する場合は追加しない
  if (newState.inventory.includes(item)) {
    return newState;
  }
  
  // アイテムを追加
  newState.inventory.push(item);
  
  // アイテム取得メッセージを追加
  newState.messages.push({
    type: 'system',
    content: `アイテムを獲得: ${item}`,
    item: true
  });
  
  return newState;
}