import { logger } from './logger.js';

/**
 * JSONの解析を安全に行うユーティリティ
 */
export class JsonParser {
  /**
   * 文字列をJSONとして安全に解析する
   * @param jsonString 解析するJSON文字列
   * @param fallback 解析失敗時のフォールバックオブジェクト
   */
  static parse<T>(jsonString: string, fallback?: T): T {
    try {
      // 直接解析を試みる
      return JSON.parse(jsonString) as T;
    } catch (err) {
      logger.debug(`JSON解析エラー: ${err instanceof Error ? err.message : String(err)}`);
      
      try {
        // マークダウンコードブロックなどからJSONを抽出
        const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          logger.debug("コードブロック内のJSONを発見、解析を試みます");
          return JSON.parse(jsonMatch[1]) as T;
        }
        
        // JSONの修正を試みる
        logger.debug("不正なJSONの修正を試みます");
        const fixedJson = this.fixJson(jsonString);
        return JSON.parse(fixedJson) as T;
      } catch (secondError) {
        logger.debug(`すべてのJSON解析が失敗しました: ${secondError instanceof Error ? secondError.message : String(secondError)}`);
        logger.debug(`元のJSON文字列: ${jsonString.substring(0, 200)}...`);
        
        if (fallback) {
          logger.debug("フォールバックオブジェクトを返します");
          return fallback;
        }
        
        throw new Error("JSON解析に失敗しました");
      }
    }
  }

  /**
   * 一般的なJSON構文エラーを修正する
   * @param jsonString 修正するJSON文字列
   */
  static fixJson(jsonString: string): string {
    // マークダウンコードブロックを削除
    let cleaned = jsonString.replace(/```json\s+|\s+```/g, '');
    
    // バッククォートを削除
    cleaned = cleaned.replace(/`/g, '');
    
    // JSONの部分のみを抽出
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }
    
    // 一般的な構文エラーを修正
    cleaned = cleaned
      // 配列やオブジェクトの末尾のカンマを修正
      .replace(/,\s*([}\]])/g, '$1')
      // プロパティ名の引用符を追加
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')
      // シングルクォートをダブルクォートに変換
      .replace(/'/g, '"')
      // 文字列内のエスケープされていない引用符を修正
      .replace(/"([^"]*?)\\?"/g, function(match) {
        return match.replace(/\\"/g, '"').replace(/"/g, '\\"');
      });
    
    return cleaned;
  }
}