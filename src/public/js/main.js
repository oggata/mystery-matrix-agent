/**
 * Adventure Game Client
 * LangGraph・LangChainを使用したアドベンチャーゲームのフロントエンドクライアント
 */

// デバッグモードのフラグ
let debugMode = false;

// APIエンドポイント
const API_ENDPOINTS = {
  VERIFY_API_KEY: '/api/verify-api-key',
  CREATE_GAME: '/api/create-game',
  PROCESS_ACTION: '/api/process-action',
  CHARACTER_DIALOGUE: '/api/character-dialogue',
  GENERATE_HINT: '/api/generate-hint',
  ANALYZE_CLUES: '/api/analyze-clues',
  SAVE_GAME: '/api/save-game',
  LOAD_GAME: '/api/load-game'
};

// ゲーム状態
let gameState = null;

// DOM要素
const apiKeySection = document.getElementById('apiKeySection');
const gameSetupSection = document.getElementById('gameSetupSection');
const gameSection = document.getElementById('gameSection');
const apiKeyInput = document.getElementById('apiKey');
const verifyApiKeyBtn = document.getElementById('verifyApiKey');
const apiKeyError = document.getElementById('apiKeyError');
const apiKeySuccess = document.getElementById('apiKeySuccess');
const gameThemeSelect = document.getElementById('gameTheme');
const customThemeGroup = document.getElementById('customThemeGroup');
const customThemeInput = document.getElementById('customTheme');
const playerNameInput = document.getElementById('playerName');
const createGameBtn = document.getElementById('createGame');
const gameSetupError = document.getElementById('gameSetupError');
const loadingGame = document.getElementById('loadingGame');
const gameOutput = document.getElementById('gameOutput');
const actionContainer = document.getElementById('actionContainer');
const actionTypeSelect = document.getElementById('actionType');
const actionTargetInput = document.getElementById('actionTarget');
const performActionBtn = document.getElementById('performAction');
const getHintBtn = document.getElementById('getHint');
const saveGameBtn = document.getElementById('saveGame');
const loadGameBtn = document.getElementById('loadGame');
const inventoryItems = document.getElementById('inventoryItems');
const clueItems = document.getElementById('clueItems');
const analyzeCluesBtn = document.getElementById('analyzeClues');
const clueAnalysis = document.getElementById('clueAnalysis');
const characterList = document.getElementById('characterList');
const gameHelp = document.getElementById('gameHelp');
const loadingAction = document.getElementById('loadingAction');
const debugConsole = document.getElementById('debugConsole');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

/**
 * アプリケーションの初期化
 */
function initializeApp() {
  // イベントリスナーの設定
  setupEventListeners();
  
  // デバッグモードのキーボードショートカット（Alt+D）
  document.addEventListener('keydown', function(e) {
    if (e.altKey && e.key === 'd') {
      toggleDebugMode();
    }
  });
  
  // ローカルストレージからゲームを読み込む
  const savedGame = localStorage.getItem('adventure_game_save');
  if (savedGame) {
    loadGameBtn.disabled = false;
  } else {
    loadGameBtn.disabled = true;
  }
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
  // APIキー検証
  verifyApiKeyBtn.addEventListener('click', verifyApiKey);
  
  // テーマ選択
  gameThemeSelect.addEventListener('change', () => {
    if (gameThemeSelect.value === 'custom') {
      customThemeGroup.classList.remove('hidden');
    } else {
      customThemeGroup.classList.add('hidden');
    }
  });
  
  // ゲーム作成
  createGameBtn.addEventListener('click', createGame);
  
  // アクション実行
  performActionBtn.addEventListener('click', () => {
    const actionType = actionTypeSelect.value;
    const target = actionTargetInput.value.trim();
    
    if (!target) {
      alert("Please enter a target for your action");
      return;
    }
    
    performAction(actionType, target);
  });
  
  // ヒント取得
  getHintBtn.addEventListener('click', getHint);
  
  // ゲーム保存
  saveGameBtn.addEventListener('click', saveGame);
  
  // ゲーム読み込み
  loadGameBtn.addEventListener('click', loadGame);
  
  // 手がかり分析
  analyzeCluesBtn.addEventListener('click', analyzeClues);
  
  // タブ切り替え
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      
      // すべてのタブから「active」クラスを削除
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // 選択されたタブに「active」クラスを追加
      tab.classList.add('active');
      document.getElementById(`${tabId}Tab`).classList.add('active');
      
      // 関連コンテンツを更新
      if (tabId === 'inventory') {
        updateInventoryDisplay();
      } else if (tabId === 'clues') {
        updateCluesDisplay();
      } else if (tabId === 'characters') {
        updateCharactersDisplay();
      } else if (tabId === 'help') {
        updateHelpDisplay();
      }
    });
  });
}

/**
 * APIキーを検証
 */
async function verifyApiKey() {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showError(apiKeyError, "Please enter an API key");
    return;
  }
  
  try {
    verifyApiKeyBtn.disabled = true;
    verifyApiKeyBtn.textContent = "Verifying...";
    
    const response = await fetch(API_ENDPOINTS.VERIFY_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ apiKey })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // APIキーを一時的にセッションストレージに保存（本番環境では別の方法が必要）
      sessionStorage.setItem('openai_api_key', apiKey);
      
      apiKeyError.classList.add('hidden');
      apiKeySuccess.textContent = "API key verified successfully!";
      apiKeySuccess.classList.remove('hidden');
      
      // ゲームセットアップセクションを表示
      setTimeout(() => {
        apiKeySection.style.display = 'none';
        gameSetupSection.style.display = 'block';
      }, 1000);
    } else {
      showError(apiKeyError, data.message || "Invalid API key");
    }
  } catch (error) {
    debug(`APIキー検証エラー: ${error.message}`);
    showError(apiKeyError, "Error verifying API key. Please try again.");
  } finally {
    verifyApiKeyBtn.disabled = false;
    verifyApiKeyBtn.textContent = "Verify API Key";
  }
}

/**
 * ゲームを作成
 */
async function createGame() {
  let theme = gameThemeSelect.value;
  
  if (theme === 'custom') {
    theme = customThemeInput.value.trim();
    
    if (!theme) {
      showError(gameSetupError, "Please enter a custom theme");
      return;
    }
  }
  
  const playerName = playerNameInput.value.trim() || "Detective";
  
  try {
    createGameBtn.disabled = true;
    gameSetupError.classList.add('hidden');
    loadingGame.style.display = 'block';
    
    const response = await fetch(API_ENDPOINTS.CREATE_GAME, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ theme, playerName })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      gameState = data.game_state;
      
      // ゲーム表示を更新
      updateGameDisplay();
      
      // ゲームセクションを表示
      gameSetupSection.style.display = 'none';
      gameSection.style.display = 'block';
    } else {
      showError(gameSetupError, data.message || "Error creating game");
    }
  } catch (error) {
    debug(`ゲーム作成エラー: ${error.message}`);
    showError(gameSetupError, "Error creating game. Please try again.");
  } finally {
    createGameBtn.disabled = false;
    loadingGame.style.display = 'none';
  }
}

/**
 * アクションを実行
 */
async function performAction(action, target) {
  if (!gameState) {
    debug('ゲーム状態がありません');
    return;
  }
  
  try {
    performActionBtn.disabled = true;
    loadingAction.style.display = 'block';
    
    const response = await fetch(API_ENDPOINTS.PROCESS_ACTION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action, target, gameState })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      gameState = data.game_state;
      
      // ゲーム表示を更新
      updateGameDisplay();
      
      // 入力をクリア
      actionTargetInput.value = '';
    } else {
      alert(data.message || "Error processing action");
    }
  } catch (error) {
    debug(`アクション実行エラー: ${error.message}`);
    alert(`Error: ${error.message}`);
  } finally {
    performActionBtn.disabled = false;
    loadingAction.style.display = 'none';
  }
}

/**
 * キャラクターとの対話を処理
 */
async function handleCharacterDialogue(characterId, topic = null) {
  if (!gameState) {
    debug('ゲーム状態がありません');
    return;
  }
  
  try {
    loadingAction.style.display = 'block';
    
    const response = await fetch(API_ENDPOINTS.CHARACTER_DIALOGUE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ characterId, topic, gameState })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      gameState = data.game_state;
      
      // ゲーム表示を更新
      updateGameDisplay();
    } else {
      alert(data.message || "Error processing dialogue");
    }
  } catch (error) {
    debug(`キャラクター対話エラー: ${error.message}`);
    alert(`Error: ${error.message}`);
  } finally {
    loadingAction.style.display = 'none';
  }
}

/**
 * ヒントを取得
 */
async function getHint() {
  if (!gameState) {
    debug('ゲーム状態がありません');
    return;
  }
  
  try {
    getHintBtn.disabled = true;
    loadingAction.style.display = 'block';
    
    const response = await fetch(API_ENDPOINTS.GENERATE_HINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ gameState, difficulty: 'normal' })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      gameState = data.game_state;
      
      // ゲーム表示を更新
      updateGameDisplay();
      
      // ヒントを特別な方法で表示
      appendToGameOutput(`<div style="background-color: #2a3950; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #ffc107;">
        <strong>HINT:</strong> ${data.result.hint}
      </div>`);
    } else {
      alert(data.message || "Error getting hint");
    }
  } catch (error) {
    debug(`ヒント取得エラー: ${error.message}`);
    alert(`Error: ${error.message}`);
  } finally {
    getHintBtn.disabled = false;
    loadingAction.style.display = 'none';
  }
}

/**
 * 手がかりを分析
 */
async function analyzeClues() {
  if (!gameState || !gameState.discovered_clues || gameState.discovered_clues.length === 0) {
    alert("You haven't discovered any clues yet.");
    return;
  }
  
  try {
    analyzeCluesBtn.disabled = true;
    analyzeCluesBtn.textContent = "Analyzing...";
    
    const response = await fetch(API_ENDPOINTS.ANALYZE_CLUES, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ gameState })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      gameState = data.game_state;
      
      // 分析結果を表示
      clueAnalysis.innerHTML = `
        <h4>Clue Analysis</h4>
        <p>${data.result.analysis}</p>
        
        <h5>Connections</h5>
        <ul>
          ${data.result.connections.map(conn => `<li>${conn}</li>`).join('')}
        </ul>
        
        <h5>Theories</h5>
        <ul>
          ${data.result.theories.map(theory => `<li>${theory}</li>`).join('')}
        </ul>
        
        <h5>Next Steps</h5>
        <ul>
          ${data.result.next_investigations.map(step => `<li>${step}</li>`).join('')}
        </ul>
      `;
      
      clueAnalysis.classList.remove('hidden');
      
      // ゲーム表示を更新
      updateGameDisplay();
    } else {
      alert(data.message || "Error analyzing clues");
    }
  } catch (error) {
    debug(`手がかり分析エラー: ${error.message}`);
    alert(`Error: ${error.message}`);
  } finally {
    analyzeCluesBtn.disabled = false;
    analyzeCluesBtn.textContent = "Analyze Clues";
  }
}

/**
 * ゲームを保存
 */
async function saveGame() {
  if (!gameState) {
    debug('ゲーム状態がありません');
    return;
  }
  
  try {
    saveGameBtn.disabled = true;
    
    const response = await fetch(API_ENDPOINTS.SAVE_GAME, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ gameState })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      localStorage.setItem('adventure_game_save', data.savedState);
      alert("Game saved successfully!");
      loadGameBtn.disabled = false;
    } else {
      alert(data.message || "Error saving game");
    }
  } catch (error) {
    debug(`ゲーム保存エラー: ${error.message}`);
    alert(`Error: ${error.message}`);
  } finally {
    saveGameBtn.disabled = false;
  }
}

/**
 * ゲームを読み込み
 */
async function loadGame() {
  try {
    const savedState = localStorage.getItem('adventure_game_save');
    
    if (!savedState) {
      alert("No saved game found!");
      return;
    }
    
    loadGameBtn.disabled = true;
    
    const response = await fetch(API_ENDPOINTS.LOAD_GAME, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ savedState })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      gameState = data.gameState;
      
      // 全ての表示を更新
      updateGameDisplay();
      updateInventoryDisplay();
      updateCluesDisplay();
      updateCharactersDisplay();
      
      // ゲームセクションを表示
      apiKeySection.style.display = 'none';
      gameSetupSection.style.display = 'none';
      gameSection.style.display = 'block';
      
      alert("Game loaded successfully!");
    } else {
      alert(data.message || "Error loading game");
    }
  } catch (error) {
    debug(`ゲーム読み込みエラー: ${error.message}`);
    alert(`Error: ${error.message}`);
  } finally {
    loadGameBtn.disabled = false;
  }
}

/**
 * ゲーム表示を更新
 */
function updateGameDisplay() {
  if (!gameState) return;
  
  // 以前の出力をクリア
  gameOutput.innerHTML = '';
  
  // メッセージを表示
  for (const message of gameState.messages) {
    appendMessageToOutput(message);
  }
  
  // 利用可能なアクションを表示
  updateAvailableActions();
  
  // その他の表示を更新
  updateInventoryDisplay();
  updateCluesDisplay();
  updateCharactersDisplay();
}

/**
 * メッセージをゲーム出力に追加
 */
function appendMessageToOutput(message) {
  let html = '';
  
  switch (message.type) {
    case 'system':
      if (message.hint) {
        html = `<div style="background-color: #2a3950; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #ffc107;">
          <strong>HINT:</strong> ${message.content}
        </div>`;
      } else if (message.item) {
        html = `<div style="background-color: #2a3950; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #5cb85c;">
          <strong>ITEM ACQUIRED:</strong> ${message.content}
        </div>`;
      } else if (message.clue) {
        html = `<div style="background-color: #2a3950; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #5bc0be;">
          <strong>CLUE DISCOVERED:</strong> ${message.content}
        </div>`;
      } else if (message.completion) {
        html = `<div style="background-color: #2a3950; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #d4af37;">
          <strong>GAME COMPLETED:</strong> ${message.content}
        </div>`;
      } else {
        html = `<div style="color: #6fffe9; margin: 5px 0;">${message.content}</div>`;
      }
      break;
      
    case 'narrative':
      html = `<div class="narrative" style="margin: 10px 0;">${message.content}</div>`;
      break;
      
    case 'player':
      html = `<div style="color: #5bc0be; margin: 5px 0;"><strong>You:</strong> ${message.action} ${message.target}</div>`;
      break;
      
    case 'character':
      html = `<div class="character-dialog">
        <div class="character-name">${message.character}:</div>
        <div>${message.content}</div>
      </div>`;
      break;
      
    default:
      html = `<div>${message.content}</div>`;
  }
  
  appendToGameOutput(html);
}

/**
 * HTMLをゲーム出力に追加し、下にスクロール
 */
function appendToGameOutput(html) {
  gameOutput.innerHTML += html;
  gameOutput.scrollTop = gameOutput.scrollHeight;
}

/**
 * 利用可能なアクションを更新
 */
function updateAvailableActions() {
  actionContainer.innerHTML = '';
  
  if (!gameState || !gameState.available_actions) return;
  
  for (const actionItem of gameState.available_actions) {
    const actionBtn = document.createElement('button');
    actionBtn.className = 'action-btn';
    
    if (typeof actionItem === 'string') {
      // 文字列アクション（例："手紙を調べる"）の場合
      actionBtn.textContent = actionItem;
      
      // テキストに基づいてアクションを解析
      let actionType = 'examine'; // デフォルトアクション
      let actionTarget = actionItem;
      
      // 日本語のアクションパターンをチェック
      if (actionItem.includes('調べる')) {
        actionType = 'examine';
        actionTarget = actionItem.replace('調べる', '').replace('を', '').trim();
      } else if (actionItem.includes('読む')) {
        actionType = 'look';
        actionTarget = actionItem.replace('読む', '').replace('を', '').trim();
      } else if (actionItem.includes('取る')) {
        actionType = 'take';
        actionTarget = actionItem.replace('取る', '').replace('を', '').trim();
      } else if (actionItem.includes('探す')) {
        actionType = 'search';
        actionTarget = actionItem.replace('探す', '').replace('を', '').trim();
      }
      
      actionBtn.addEventListener('click', () => {
        performAction(actionType, actionTarget);
      });
    } else {
      // アクションとターゲットプロパティを持つオブジェクトの場合
      actionBtn.textContent = `${actionItem.action} ${actionItem.target}`;
      actionBtn.title = actionItem.description;
      
      actionBtn.addEventListener('click', () => {
        performAction(actionItem.action, actionItem.target);
      });
    }
    
    actionContainer.appendChild(actionBtn);
  }
}

/**
 * インベントリ表示を更新
 */
function updateInventoryDisplay() {
  inventoryItems.innerHTML = '';
  
  if (!gameState) return;
  
  const inventory = gameState.inventory;
  
  if (inventory.length === 0) {
    inventoryItems.innerHTML = '<p>Your inventory is empty.</p>';
    return;
  }
  
  for (const item of inventory) {
    const itemElement = document.createElement('div');
    itemElement.className = 'inventory-item';
    itemElement.innerHTML = `<h4>${item}</h4>`;
    
    // アクションボタンを追加
    const actionButtonsContainer = document.createElement('div');
    actionButtonsContainer.style.marginTop = '10px';
    
    const examineBtn = document.createElement('button');
    examineBtn.textContent = 'Examine';
    examineBtn.className = 'action-btn';
    examineBtn.addEventListener('click', () => {
      performAction('examine', item);
    });
    
    const useBtn = document.createElement('button');
    useBtn.textContent = 'Use';
    useBtn.className = 'action-btn';
    useBtn.style.marginLeft = '10px';
    useBtn.addEventListener('click', () => {
      const target = prompt('What would you like to use this item on?');
      if (target) {
        performAction('use', `${item} on ${target}`);
      }
    });
    
    actionButtonsContainer.appendChild(examineBtn);
    actionButtonsContainer.appendChild(useBtn);
    itemElement.appendChild(actionButtonsContainer);
    
    inventoryItems.appendChild(itemElement);
  }
}

/**
 * 手がかり表示を更新
 */
function updateCluesDisplay() {
  clueItems.innerHTML = '';
  
  if (!gameState) return;
  
  const clues = gameState.discovered_clues;
  
  if (clues.length === 0) {
    clueItems.innerHTML = '<p>You haven\'t discovered any clues yet.</p>';
    clueAnalysis.classList.add('hidden');
    return;
  }
  
  for (const clueId of clues) {
    // 手がかりの詳細を取得（IDまたは名前で検索）
    let clueDetails = gameState.story_context.clues.find(c => c.id === clueId);
    
    // IDで見つからない場合は名前で検索
    if (!clueDetails) {
      clueDetails = gameState.story_context.clues.find(c => c.name === clueId);
    }
    
    if (!clueDetails) {
      debug(`手がかりが見つかりません: ${clueId}`);
      continue;
    }
    
    const clueElement = document.createElement('div');
    clueElement.className = 'clue-item';
    
    clueElement.innerHTML = `
      <h4>${clueDetails.name}</h4>
      <p>${clueDetails.description}</p>
      <div><strong>Importance:</strong> ${'★'.repeat(clueDetails.importance)}</div>
    `;
    
    clueItems.appendChild(clueElement);
  }
}

/**
 * キャラクター表示を更新
 */
function updateCharactersDisplay() {
  characterList.innerHTML = '';
  
  if (!gameState) return;
  
  // game_progressが存在するか確認
  if (!gameState.game_progress) {
    gameState.game_progress = {};
  }
  
  // プレイヤーが出会ったキャラクターのみを表示
  const metCharacters = gameState.game_progress.met_characters || [];
  
  debug(`出会ったキャラクター: ${JSON.stringify(metCharacters)}`);
  
  if (metCharacters.length === 0) {
    // 明示的に出会ったキャラクターがない場合、現在のロケーションのキャラクターを表示
    const currentScene = gameState.current_scene;
    const currentLocation = Object.values(gameState.locations).find(
      loc => loc.id === currentScene || loc.connected_locations.includes(currentScene)
    );
    
    if (currentLocation && currentLocation.characters && currentLocation.characters.length > 0) {
      // 現在のロケーションのキャラクターを表示
      for (const characterId of currentLocation.characters) {
        renderCharacterElement(characterId);
      }
      return;
    }
    
    characterList.innerHTML = '<p>You haven\'t met any characters yet.</p>';
    return;
  }
  
  // 出会ったキャラクターをレンダリング
  for (const characterId of metCharacters) {
    renderCharacterElement(characterId);
  }
  
  // キャラクター要素をレンダリングするヘルパー関数
  function renderCharacterElement(characterId) {
    let character = gameState.characters[characterId];

    // 名前で検索してIDを逆引き
    if (!character) {
      const charObj = Object.values(gameState.characters).find(
        c => c.name === characterId
      );
      if (charObj) character = charObj;
    }

    if (!character) {
      debug(`キャラクターが見つかりません: ${characterId}`);
      return;
    }
    
    const characterElement = document.createElement('div');
    characterElement.className = 'character-item';
    characterElement.style.backgroundColor = '#2a3950';
    characterElement.style.padding = '15px';
    characterElement.style.marginBottom = '15px';
    characterElement.style.borderRadius = '5px';
    
    characterElement.innerHTML = `
      <h4>${character.name}</h4>
      <p><strong>Age:</strong> ${character.age}</p>
      <p><strong>Occupation:</strong> ${character.occupation}</p>
      <p><strong>Description:</strong> ${character.description}</p>
    `;
    
    // 「話す」ボタン
    const talkBtn = document.createElement('button');
    talkBtn.textContent = 'Talk to this character';
    talkBtn.className = 'action-btn';
    talkBtn.addEventListener('click', () => {
      handleCharacterDialogue(character.id);
    });
    
    characterElement.appendChild(talkBtn);
    
    // 「質問する」ボタン
    const askBtn = document.createElement('button');
    askBtn.textContent = 'Ask about...';
    askBtn.className = 'action-btn';
    askBtn.style.marginLeft = '10px';
    askBtn.addEventListener('click', () => {
      const topic = prompt('What would you like to ask about?');
      if (topic) {
        performAction('ask', `${character.id} about ${topic}`);
      }
    });
    
    characterElement.appendChild(askBtn);
    
    characterList.appendChild(characterElement);
  }
}

/**
 * ヘルプ表示を更新
 */
function updateHelpDisplay() {
  // 基本的なゲームヘルプ情報
  const helpInfo = {
    available_actions: {
      move: "Move to a different location",
      examine: "Examine an object or person in detail",
      search: "Search the current area",
      ask: "Ask someone about a topic",
      talk: "Talk to a character",
      take: "Take an item",
      look: "Look at something",
      show: "Show an item to someone",
      call: "Call someone on the phone"
    },
    game_mechanics: {
      inventory: "Manage your inventory of collected items",
      clues: "Review discovered clues",
      relationships: "Track relationships between characters",
      locations: "Explore different locations",
      story_progress: "Follow the story progress"
    },
    tips: [
      "Carefully examine all clues you find",
      "Talk to characters to gather information",
      "Use items at the right time",
      "Carefully examine all clues you find",
      "Talk to characters to gather information",
      "Use items at the right time and place",
      "Thoroughly explore locations before moving on",
      "Combine clues to make new discoveries",
      "Pay attention to character reactions and emotions",
      "Don't forget to check your inventory regularly"
    ]
  };
  
  gameHelp.innerHTML = `
    <h4>Available Actions</h4>
    <ul>
      ${Object.entries(helpInfo.available_actions).map(([action, desc]) => 
        `<li><strong>${action}:</strong> ${desc}</li>`
      ).join('')}
    </ul>
    
    <h4>Game Mechanics</h4>
    <ul>
      ${Object.entries(helpInfo.game_mechanics).map(([mechanic, desc]) => 
        `<li><strong>${mechanic}:</strong> ${desc}</li>`
      ).join('')}
    </ul>
    
    <h4>Tips</h4>
    <ul>
      ${helpInfo.tips.map(tip => `<li>${tip}</li>`).join('')}
    </ul>
  `;
}

/**
 * エラーメッセージを表示
 */
function showError(element, message) {
  element.textContent = message;
  element.classList.remove('hidden');
}

/**
 * デバッグメッセージを表示
 */
function debug(message) {
  if (!debugMode) return;
  
  if (debugConsole) {
    const timestamp = new Date().toISOString().substr(11, 8);
    debugConsole.innerHTML += `<div>[${timestamp}] ${message}</div>`;
    debugConsole.scrollTop = debugConsole.scrollHeight;
  }
  
  console.log(`[DEBUG] ${message}`);
}

/**
 * デバッグモードの切り替え
 */
function toggleDebugMode() {
  debugMode = !debugMode;
  
  if (debugConsole) {
    debugConsole.style.display = debugMode ? 'block' : 'none';
  }
  
  debug(`デバッグモード ${debugMode ? '有効' : '無効'}`);
  alert(`Debug mode ${debugMode ? 'enabled' : 'disabled'}`);
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', initializeApp);