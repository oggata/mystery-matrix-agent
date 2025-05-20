import { END } from "@langchain/langgraph";
// もしRunnableSequenceが必要なら、正しい場所からインポート
import { RunnableSequence } from "@langchain/core/runnables";
import { GraphState } from "../types/index.js";
import { logger } from "../utils/logger.js";

/**
 * アクションノードの後に実行するノードを決定する
 */
export function routeAfterAction(state: GraphState): string {
  // アクション結果が利用可能な場合
  if (state.result) {
    logger.debug("アクション処理後のルーティング: END");
    return END; // フローを終了
  }
  
  // デフォルトはENDに進む
  return END;
}

/**
 * ダイアログノードの後に実行するノードを決定する
 */
export function routeAfterDialogue(state: GraphState): string {
  // ダイアログ結果が利用可能な場合
  if (state.result) {
    logger.debug("ダイアログ処理後のルーティング: END");
    return END; // フローを終了
  }
  
  // デフォルトはENDに進む
  return END;
}

/**
 * ヒントノードの後に実行するノードを決定する
 */
export function routeAfterHint(state: GraphState): string {
  // ヒント結果が利用可能な場合
  if (state.result) {
    logger.debug("ヒント生成後のルーティング: END");
    return END; // フローを終了
  }
  
  // デフォルトはENDに進む
  return END;
}

/**
 * 手がかり分析の後に実行するノードを決定する
 */
export function routeAfterClueAnalysis(state: GraphState): string {
  // 分析結果が利用可能な場合
  if (state.result) {
    logger.debug("手がかり分析後のルーティング: END");
    return END; // フローを終了
  }
  
  // デフォルトはENDに進む
  return END;
}

/**
 * ストーリー生成の後に実行するノードを決定する
 */
export function routeAfterStoryGeneration(state: GraphState): string {
  // ストーリー生成結果が利用可能な場合
  if (state.result) {
    logger.debug("ストーリー生成後のルーティング: END");
    return END; // フローを終了
  }
  
  // デフォルトはENDに進む
  return END;
}