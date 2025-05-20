import { ChatPromptTemplate } from "@langchain/core/prompts";
import { openai } from "../../utils/openai.js";
import { JsonParser } from "../../utils/jsonParser.js";
import { logger } from "../../utils/logger.js";
import { GraphState, ActionResult, Character } from "../../types/index.js";
import { addClueToGameState, addItemToGameState, addMessageToGameState, cloneGameState } from "../../models/gameState.js";

/**
 * アクションを処理するためのプロンプトテンプレート
 */
const actionProcessPrompt = ChatPromptTemplate.fromMessages([
  ["system", "あなたは、プレイヤーのアクションを処理するアドベンチャーゲームエンジンです。レスポンスを有効なJSONとして返してください。レスポンスにバックスティック（`）やその他の書式を使用しないでください。言語は日本語で書いてください。"],
  ["user", `プレイヤーのアクションを処理:
                            
アクション: {action}
ターゲット: {target}
現在のシーン: {current_scene}
ストーリーコンテキスト: {story_context}
インベントリ: {inventory}
発見した手がかり: {discovered_clues}
ゲームの進行: {game_progress}

結果をJSON形式で返してください:
{
    "next_scene": "次のシーンのID",
    "description": "何が起こったかの詳細な説明",
    "new_clues": ["発見された新しい手がかり"],
    "new_items": ["取得された新しいアイテム"],
    "available_actions": ["このアクションの後に利用可能なアクション"]
}`]
]);

/**
 * プレイヤーのアクションを処理するノード
 */
export async function processAction(state: GraphState): Promise<GraphState> {
  if (!state.action || !state.game_state) {
    logger.error("アクション処理に必要な情報が不足しています");
    throw new Error("アクション処理に必要な情報が不足しています");
  }
  
  const { type: action, target } = state.action;
  const gameState = state.game_state;
  
  logger.info(`アクション処理: ${action} ${target}`);
  
  try {
    // プレイヤーのアクションをメッセージに追加
    let updatedGameState = addMessageToGameState(gameState, {
      type: 'player',
      content: `${action} ${target}`,
      action,
      target
    });
    
    // アクションプロンプトの構築と実行
    const formattedPrompt = await actionProcessPrompt.invoke({
      action,
      target,
      current_scene: gameState.current_scene,
      story_context: JSON.stringify(gameState.story_context),
      inventory: JSON.stringify(gameState.inventory),
      discovered_clues: JSON.stringify(gameState.discovered_clues),
      game_progress: JSON.stringify(gameState.game_progress)
    });
    
    const response = await openai.invoke(formattedPrompt.toChatMessages());
    const result = JsonParser.parse<ActionResult>(response.content.toString());
    
    logger.debug(`アクション処理結果:`, result);
    
    // 結果に基づいてゲーム状態を更新
    
    // 新しい手がかりの処理
    if (result.new_clues && result.new_clues.length > 0) {
      for (const clue of result.new_clues) {
        updatedGameState = addClueToGameState(updatedGameState, clue);
      }
    }
    
    // 新しいアイテムの処理
    if (result.new_items && result.new_items.length > 0) {
      for (const item of result.new_items) {
        updatedGameState = addItemToGameState(updatedGameState, item);
      }
    }
    
    // キャラクターとの遭遇を処理
    if (action === "talk" || action === "ask") {
      const newState = cloneGameState(updatedGameState);
      if (!newState.game_progress.met_characters) {
        newState.game_progress.met_characters = [];
      }

      let characterId = target;
      if (action === "ask" && target.includes(" about ")) {
        characterId = target.split(" about ")[0];
      }

      // 名前→ID変換
      const charObj = newState.story_context.characters.find(
        (c: Character) => c.id === characterId || c.name === characterId
      );
      if (charObj) characterId = charObj.id;

      if (characterId && !newState.game_progress.met_characters.includes(characterId)) {
        newState.game_progress.met_characters.push(characterId);
      }
      
      updatedGameState = newState;
    }
    
    // ストーリー内でエンカウントしたキャラクターを検出
    if (result.description) {
      const newState = cloneGameState(updatedGameState);
      
      // キャラクター検出ロジック
      const mentionedCharacters = newState.story_context.characters.filter(
        (character: Character) => result.description.includes(character.name)
      );
      
      // met_characters配列の初期化（存在しない場合）
      if (!newState.game_progress.met_characters) {
        newState.game_progress.met_characters = [];
      }
      
      // 検出したキャラクターを追加
      for (const character of mentionedCharacters) {
        if (!newState.game_progress.met_characters.includes(character.id)) {
          newState.game_progress.met_characters.push(character.id);
          logger.debug(`ストーリー内でキャラクターを検出: ${character.name} (${character.id})`);
        }
      }
      
      updatedGameState = newState;
    }
    
    // 利用可能なアクションを更新
    updatedGameState.available_actions = result.available_actions;
    
    // 次のシーンを設定
    if (result.next_scene) {
      updatedGameState.current_scene = result.next_scene;
    }
    
    // アクション結果をメッセージに追加
    updatedGameState = addMessageToGameState(updatedGameState, {
      type: 'narrative',
      content: result.description
    });
    
    // 更新された状態を返す
    return {
      ...state,
      game_state: updatedGameState,
      result
    };
  } catch (error) {
    logger.error("アクション処理エラー:", error);
    throw new Error(`アクションの処理に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
}