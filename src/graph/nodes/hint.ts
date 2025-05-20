import { ChatPromptTemplate } from "@langchain/core/prompts";
import { openai } from "../../utils/openai.js";
import { JsonParser } from "../../utils/jsonParser.js";
import { logger } from "../../utils/logger.js";
import { GraphState, HintResult } from "../../types/index.js";
import { addMessageToGameState } from "../../models/gameState.js";

/**
 * ヒントを生成するプロンプトテンプレート
 */
const hintGenerationPrompt = ChatPromptTemplate.fromMessages([
  ["system", "あなたは、役立つヒントを提供するアドベンチャーゲームのアシスタントです。レスポンスを有効なJSONとして返してください。レスポンスにバックスティック（`）やその他の書式を使用しないでください。言語は日本語で書いてください。"],
  ["user", `Generate a hint for the player based on their current game state:
                            
Story context: {story_context}
Current scene: {current_scene}
Discovered clues: {discovered_clues}
Inventory: {inventory}
Game progress: {game_progress}
Difficulty level: {difficulty}

Provide a hint that helps them progress without giving away too much. Format as JSON:
{
    "hint": "The hint content",
    "relevance": "Why this hint is relevant now",
    "next_action": "Suggested next action",
    "difficulty_level": "{difficulty}"
}`]
]);

/**
 * ヒントを生成するノード
 */
export async function generateHint(state: GraphState): Promise<GraphState> {
  if (!state.game_state) {
    logger.error("ヒント生成に必要な情報が不足しています");
    throw new Error("ヒント生成に必要な情報が不足しています");
  }
  
  const gameState = state.game_state;
  const difficulty = state.difficulty || "normal";
  
  logger.info(`難易度 "${difficulty}" のヒントを生成します`);
  
  try {
    // ヒント生成プロンプトの構築と実行
    const formattedPrompt = await hintGenerationPrompt.invoke({
      story_context: JSON.stringify(gameState.story_context),
      current_scene: gameState.current_scene,
      discovered_clues: JSON.stringify(gameState.discovered_clues),
      inventory: JSON.stringify(gameState.inventory),
      game_progress: JSON.stringify(gameState.game_progress),
      difficulty
    });
    
    const response = await openai.invoke(formattedPrompt);
    const hintData = JsonParser.parse<HintResult>(response.content.toString());
    
    logger.debug(`ヒント生成結果:`, hintData);
    
    // ヒントをメッセージに追加
    const updatedGameState = addMessageToGameState(gameState, {
      type: 'system',
      content: `HINT: ${hintData.hint}`,
      hint: true
    });
    
    // 更新された状態を返す
    return {
      ...state,
      game_state: updatedGameState,
      result: hintData
    };
  } catch (error) {
    logger.error("ヒント生成エラー:", error);
    throw new Error(`ヒントの生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
}