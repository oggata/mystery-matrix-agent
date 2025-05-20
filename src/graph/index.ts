import { StateGraph, END } from "@langchain/langgraph";
import { 
  routeAfterAction, 
  routeAfterClueAnalysis, 
  routeAfterDialogue, 
  routeAfterHint, 
  routeAfterStoryGeneration 
} from "./edges.js";
import { processAction } from "./nodes/action.js";
import { analyzeClues } from "./nodes/clue.js";
import { processDialogue } from "./nodes/dialogue.js";
import { generateHint } from "./nodes/hint.js";
import { generateStory } from "./nodes/story.js";
import { GraphState } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { createEmptyGameState } from "../types/index.js";

/**
 * 状態グラフファクトリー関数：グラフを生成して返す
 */
export function createAdventureGameGraph() {
  logger.info("アドベンチャーゲームグラフを作成");
  
  // グラフの作成 - 型定義を正確に合わせる
  const graph = new StateGraph<GraphState>({
    channels: {
      game_state: {
        // value: 二つの状態をマージする関数、nullなら後者の状態を使用
        value: null,
        // default: GameState型の初期状態を返す関数
        default: () => createEmptyGameState()
      }
    }
  });
  
  // ノードの追加
  graph.addNode("generate_story", {
    execute: async (state, config) => {
      // 必要なパラメーターがあることを確認
      const { theme, player_name } = config as { theme: string; player_name: string };
      if (!theme) {
        throw new Error("ストーリー生成にはテーマが必要です");
      }
      
      return generateStory(state, theme, player_name || "Player");
    }
  });
  
  graph.addNode("process_action", {
    execute: processAction
  });
  
  graph.addNode("process_dialogue", {
    execute: processDialogue
  });
  
  graph.addNode("generate_hint", {
    execute: generateHint
  });
  
  graph.addNode("analyze_clues", {
    execute: analyzeClues
  });
  
  // エッジの追加 - 明示的な型注釈を追加
  graph.addConditionalEdges(
    "generate_story",
    (state: GraphState) => routeAfterStoryGeneration(state),
    {
      [END]: END
    }
  );

  graph.addConditionalEdges(
    "process_action",
    (state: GraphState) => routeAfterAction(state),
    {
      [END]: END
    }
  );

  graph.addConditionalEdges(
    "process_dialogue",
    (state: GraphState) => routeAfterDialogue(state),
    {
      [END]: END
    }
  );

  graph.addConditionalEdges(
    "generate_hint",
    (state: GraphState) => routeAfterHint(state),
    {
      [END]: END
    }
  );

  graph.addConditionalEdges(
    "analyze_clues",
    (state: GraphState) => routeAfterClueAnalysis(state),
    {
      [END]: END
    }
  );
  
  // グラフのコンパイル
  return graph.compile();
}

// ヘルパー関数は以前のコードのまま保持

// 各ノードを実行するためのヘルパー関数
// 各ノードを実行するためのヘルパー関数
export async function runGenerateStory(state: GraphState, theme: string, playerName: string) {
  const graph = createAdventureGameGraph();
  // 最新APIでは、開始ノードをconfigに直接指定するのではなく
  // 特別な方法で指定する必要があるかもしれません
  return await graph.invoke({
    ...state,
    configurable: {
      generate_story: {
        theme,
        player_name: playerName
      }
    }
  });
}

export async function runProcessAction(state: GraphState) {
  const graph = createAdventureGameGraph();
  // カスタムノードの実行方法を確認して適応する必要があります
  return await graph.invoke(state);
}

export async function runProcessDialogue(state: GraphState) {
  const graph = createAdventureGameGraph();
  return await graph.invoke(state);
}

export async function runGenerateHint(state: GraphState) {
  const graph = createAdventureGameGraph();
  return await graph.invoke(state);
}

export async function runAnalyzeClues(state: GraphState) {
  const graph = createAdventureGameGraph();
  return await graph.invoke(state);
}