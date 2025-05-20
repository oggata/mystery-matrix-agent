import { ChatPromptTemplate } from "@langchain/core/prompts";
import { openai } from "../../utils/openai.js";
import { JsonParser } from "../../utils/jsonParser.js";
import { logger } from "../../utils/logger.js";
import { GraphState, ClueAnalysisResult } from "../../types/index.js";
import { addMessageToGameState } from "../../models/gameState.js";

/**
 * 手がかりを分析するプロンプトテンプレート
 */
const clueAnalysisPrompt = ChatPromptTemplate.fromMessages([
  ["system", "あなたは手がかりを分析するアドベンチャーゲームのアシスタントです。レスポンスを有効なJSONとして返してください。レスポンスにバックスティック（`）やその他の書式を使用しないでください。言語は日本語で書いてください。"],
  ["user", `Analyze the clues the player has discovered:
                            
Story context: {story_context}
Discovered clues: {discovered_clues}
Game progress: {game_progress}

Return your analysis in JSON format:
{
    "analysis": "Detailed analysis of the clues",
    "connections": ["Connections between different clues"],
    "theories": ["Possible theories based on the clues"],
    "next_investigations": ["Suggested next investigation steps"]
}`]
]);

/**
 * 手がかりを分析するノード
 */
export async function analyzeClues(state: GraphState): Promise<GraphState> {
  if (!state.game_state) {
    logger.error("手がかり分析に必要な情報が不足しています");
    throw new Error("手がかり分析に必要な情報が不足しています");
  }
  
  const gameState = state.game_state;
  
  // 手がかりがない場合はエラー
  if (!gameState.discovered_clues || gameState.discovered_clues.length === 0) {
    logger.warn("分析する手がかりがありません");
    throw new Error("分析する手がかりがありません");
  }
  
  logger.info("手がかりを分析します");
  
  try {
    // 手がかり分析プロンプトの構築と実行
    const formattedPrompt = await clueAnalysisPrompt.invoke({
      story_context: JSON.stringify(gameState.story_context),
      discovered_clues: JSON.stringify(gameState.discovered_clues),
      game_progress: JSON.stringify(gameState.game_progress)
    });
    
    const response = await openai.invoke(formattedPrompt.toChatMessages());
    const analysisData = JsonParser.parse<ClueAnalysisResult>(response.content.toString());
    
    logger.debug(`手がかり分析結果:`, analysisData);
    
    // 分析結果をメッセージに追加
    const updatedGameState = addMessageToGameState(gameState, {
      type: 'system',
      content: `CLUE ANALYSIS: ${analysisData.analysis}`,
      analysis: true
    });
    
    // 更新された状態を返す
    return {
      ...state,
      game_state: updatedGameState,
      result: analysisData
    };
  } catch (error) {
    logger.error("手がかり分析エラー:", error);
    throw new Error(`手がかりの分析に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
}