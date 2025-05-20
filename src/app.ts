import { startServer } from './server.js';
import { logger } from './utils/logger.js';
import { config } from './config/config.js';

/**
 * アプリケーションのメイン関数
 */
async function main() {
  try {
    logger.info(`アドベンチャーゲームエンジンを起動中（環境: ${config.nodeEnv}）`);
    
    // デバッグモードの設定
    if (config.debugMode) {
      logger.setDebugMode(true);
      logger.debug('デバッグモードが有効です');
    }
    
    // サーバーの起動
    const server = startServer();
    
    // シャットダウンハンドラーの設定
    process.on('SIGINT', () => {
      logger.info('サーバーをシャットダウンしています...');
      server.close(() => {
        logger.info('サーバーが正常にシャットダウンされました');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('アプリケーション起動エラー:', error);
    process.exit(1);
  }
}

// アプリケーションの実行
main();