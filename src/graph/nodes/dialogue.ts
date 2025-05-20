import { ChatPromptTemplate } from "@langchain/core/prompts";
import { openai } from "../../utils/openai.js";
import { JsonParser } from "../../utils/jsonParser.js";
import { logger } from "../../utils/logger.js";
import { GraphState, DialogueResult, Character } from "../../types/index.js";
import { addClueToGameState, addMessageToGameState, cloneGameState } from "../../models/gameState.js";

/**
 * キャラクターとの対話を生成するプロンプトテンプレート
 */
const characterDialoguePrompt = ChatPromptTemplate.fromMessages([
  ["system", "アドベンチャーゲームのキャラクターのダイアログを生成しています。レスポンスを有効なJSONとして返してください。レスポンスにバックスティック（`）やその他の書式を使用しないでください。言語は日本語で書いてください。"],
  ["user", `キャラクターのダイアログを生成:
                            
キャラクター情報: {character_info}
現在のシーン: {current_scene}
発見した手がかり: {discovered_clues}
前回の対話コンテキスト: {dialogue_context}
トピック: {topic}

ダイアログをJSON形式で返してください:
{
    "dialogue": "キャラクターのダイアログ",
    "emotion": "キャラクターの感情状態",
    "hints": ["ダイアログで提供されたヒント"],
    "next_topics": ["次の会話の潜在的なトピック"]
}`]
]);

/**
 * キャラクターとの対話を処理するノード
 */
export async function processDialogue(state: GraphState): Promise<GraphState> {
  if (!state.character_id || !state.game_state) {
    logger.error("ダイアログ処理に必要な情報が不足しています");
    throw new Error("ダイアログ処理に必要な情報が不足しています");
  }
  
  const { character_id, topic } = state;
  const gameState = state.game_state;
  
  // キャラクター情報の取得
  const character = gameState.characters[character_id];
  
  if (!character) {
    logger.error(`キャラクター "${character_id}" が見つかりません`);
    throw new Error(`キャラクター "${character_id}" が見つかりません`);
  }
  
  logger.info(`キャラクターとの対話: ${character.name}`);
  
  try {
    // キャラクターとの対話履歴を初期化または更新
    const newState = cloneGameState(gameState);
    if (!newState.game_progress.met_characters) {
      newState.game_progress.met_characters = [];
    }
    
    if (!newState.game_progress.met_characters.includes(character_id)) {
      newState.game_progress.met_characters.push(character_id);
    }
    
    // ダイアログコンテキストの作成
    const dialogueContext = {
      lastTopic: null,
      lastEmotion: null,
      lastHints: [],
      timestamp: null
    };
    
    // ダイアログ生成プロンプトの構築と実行
    const formattedPrompt = await characterDialoguePrompt.invoke({
      character_info: JSON.stringify(character),
      current_scene: newState.current_scene,
      discovered_clues: JSON.stringify(newState.discovered_clues),
      dialogue_context: JSON.stringify(dialogueContext),
      topic: topic || '一般的な会話'
    });
    
    const response = await openai.invoke(formattedPrompt);
    const dialogueData = JsonParser.parse<DialogueResult>(response.content.toString());
    
    logger.debug(`ダイアログ生成結果:`, dialogueData);
    
    // ダイアログをメッセージに追加
    let updatedGameState = addMessageToGameState(newState, {
      type: 'character',
      character: character.name,
      content: dialogueData.dialogue,
      emotion: dialogueData.emotion
    });
    
    // ヒントから新しい手がかりを処理
    if (dialogueData.hints && dialogueData.hints.length > 0) {
      for (const hint of dialogueData.hints) {
        // ヒントが手がかりとして扱えるか確認
        const isClue = updatedGameState.story_context.clues.some(
          clue => clue.id === hint || clue.name === hint
        );
        
        if (isClue) {
          updatedGameState = addClueToGameState(updatedGameState, hint);
        }
      }
    }
    
    // 更新された状態を返す
    return {
      ...state,
      game_state: updatedGameState,
      result: dialogueData
    };
  } catch (error) {
    logger.error("ダイアログ処理エラー:", error);
    throw new Error(`ダイアログの処理に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
}