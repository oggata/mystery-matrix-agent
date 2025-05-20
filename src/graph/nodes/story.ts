import { ChatPromptTemplate } from "@langchain/core/prompts";
import { openai } from "../../utils/openai.js";
import { JsonParser } from "../../utils/jsonParser.js";
import { logger } from "../../utils/logger.js";
import { GraphState, Story } from "../../types/index.js";
import { addMessageToGameState, createInitialGameState } from "../../models/gameState.js";

/**
 * 新しいストーリーを生成するためのプロンプトテンプレート
 */
const storyGenerationPrompt = ChatPromptTemplate.fromMessages([
  ["system", "あなたは、没入型のストーリーを作成するアドベンチャーゲームのデザイナーです。レスポンスを有効なJSONとして返してください。レスポンスにバックスティック（`）やその他の書式を使用しないでください。言語は日本語で書いてください。"],
  ["user", `Create a mystery adventure game story based on the theme: {theme}
                            
Include the following elements:
1. A detailed game overview
2. Detailed profiles of key characters
3. A detailed story progression
4. A flow of player actions and discoveries
5. Specific details of evidence, artifacts, locations, and testimony

Structure your output in the following JSON format:
{
    "title": "Game title",
    "overview": "Game overview",
    "characters": [
        {
            "id": "character_id",
            "name": "Name",
            "age": Age,
            "occupation": "Occupation",
            "personality": "Personality traits",
            "description": "Description",
            "relationships": {"related_character_id": "Relationship description"},
            "knowledge": ["Information this character knows"],
            "secrets": ["Character's secrets"]
        }
    ],
    "locations": [
        {
            "id": "location_id",
            "name": "Location name",
            "description": "Location description",
            "connected_locations": ["Connected location IDs"],
            "items": ["Items found here"],
            "clues": ["Clues found here"],
            "characters": ["Character IDs present here"]
        }
    ],
    "clues": [
        {
            "id": "clue_id",
            "name": "Clue name",
            "description": "Clue description",
            "importance": Importance (1-5),
            "related_clues": ["Related clue IDs"],
            "related_characters": ["Related character IDs"]
        }
    ],
    "story_arc": [
        {
            "scene_id": "scene_id",
            "description": "Scene description",
            "required_clues": ["Required clue IDs"],
            "available_actions": ["Available actions"],
            "next_scenes": ["Next scene IDs"]
        }
    ]
}`]
]);

/**
 * 初期シーン情報を取得するためのプロンプトテンプレート
 */
const initialScenePrompt = ChatPromptTemplate.fromMessages([
  ["system", "あなたはシーンを描写するアドベンチャーゲームエンジンです。レスポンスを有効なJSONとして返してください。レスポンスにバックスティック（`）やその他のフォーマットを使用しないでください。言語は日本語で書いてください。"],
  ["user", `現在のシーンと利用可能なアクションを説明する:
                            
Current scene: {scene}
Story context: {story_context}

Return the scene information in JSON format:
{
    "description": "Detailed scene description",
    "available_actions": [
        {"action": "action_type", "description": "Action description", "target": "action_target"},
        ...
    ]
}`]
]);

/**
 * ストーリーを生成するノード
 */
export async function generateStory(state: GraphState, theme: string, playerName: string): Promise<GraphState> {
  logger.info(`テーマ "${theme}" のストーリーを生成します`);
  
  try {
    // ストーリープロンプトの構築と実行
    const formattedPrompt = await storyGenerationPrompt.invoke({
      theme
    });
    
    const response = await openai.invoke(formattedPrompt);
    const storyData = JsonParser.parse<Story>(response.content.toString());
    
    logger.info(`"${storyData.title}" というタイトルでストーリーが生成されました`);
    
    // 初期ゲーム状態の作成
    const gameState = createInitialGameState(storyData, playerName);
    
    // 初期シーンを取得
    const initialSceneData = await initialScenePrompt.invoke({
      scene: gameState.current_scene,
      story_context: JSON.stringify(storyData)
    });
    
    const sceneInfo = JsonParser.parse<{ description: string; available_actions: any[] }>(
      initialSceneData.toString()
    );
    
    // シーン情報をゲーム状態に追加
    gameState.available_actions = sceneInfo.available_actions;
    
    // シーンの説明をメッセージに追加
    const updatedGameState = addMessageToGameState(gameState, {
      type: 'narrative',
      content: sceneInfo.description
    });
    
    // 更新された状態を返す
    return {
      ...state,
      game_state: updatedGameState,
      result: sceneInfo
    };
  } catch (error) {
    logger.error("ストーリー生成エラー:", error);
    throw new Error(`ストーリーの生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
}