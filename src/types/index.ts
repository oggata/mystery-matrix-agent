// ゲームに関連する基本型定義
export interface Character {
  id: string;
  name: string;
  age: number;
  occupation: string;
  personality: string;
  description: string;
  relationships: Record<string, string>;
  knowledge: string[];
  secrets: string[];
}

export interface Location {
  id: string;
  name: string;
  description: string;
  connected_locations: string[];
  items: string[];
  clues: string[];
  characters: string[];
}

export interface Clue {
  id: string;
  name: string;
  description: string;
  importance: number;
  related_clues: string[];
  related_characters: string[];
}

export interface StoryScene {
  scene_id: string;
  description: string;
  required_clues: string[];
  available_actions: string[];
  next_scenes: string[];
}

export interface Story {
  title: string;
  overview: string;
  characters: Character[];
  locations: Location[];
  clues: Clue[];
  story_arc: StoryScene[];
}

export interface GameMessage {
  type: 'system' | 'narrative' | 'player' | 'character';
  content: string;
  character?: string;
  emotion?: string;
  action?: string;
  target?: string;
  clue?: boolean;
  item?: boolean;
  hint?: boolean;
  analysis?: boolean;
  completion?: boolean;
}

export interface GameState {
  messages: GameMessage[];
  current_scene: string;
  inventory: string[];
  discovered_clues: string[];
  game_progress: Record<string, any>;
  available_actions: Array<string | { action: string; description: string; target: string }>;
  story_context: Story;
  characters: Record<string, Character>;
  locations: Record<string, Location>;
  player_name: string;
}

export interface ActionResult {
  next_scene: string;
  description: string;
  new_clues: string[];
  new_items: string[];
  available_actions: Array<string | { action: string; description: string; target: string }>;
}

export interface DialogueResult {
  dialogue: string;
  emotion: string;
  hints: string[];
  next_topics: string[];
}

export interface HintResult {
  hint: string;
  relevance: string;
  next_action: string;
  difficulty_level: string;
}

export interface ClueAnalysisResult {
  analysis: string;
  connections: string[];
  theories: string[];
  next_investigations: string[];
}

export interface GameCompletionResult {
  is_completed: boolean;
  completion_percentage: number;
  missing_elements: string[];
  final_summary: string;
}

export interface SceneInfo {
  description: string;
  available_actions: Array<{ action: string; description: string; target: string }>;
}

// LangGraph用の状態型定義
export interface GraphState {
  game_state: GameState;
  action?: {
    type: string;
    target: string;
  };
  character_id?: string;
  topic?: string;
  difficulty?: string;
  result?: ActionResult | DialogueResult | HintResult | ClueAnalysisResult | GameCompletionResult | SceneInfo;
}


export function createEmptyGameState(): GameState {
  return {
    messages: [],
    current_scene: '',
    inventory: [],
    discovered_clues: [],
    game_progress: {},
    available_actions: [],
    story_context: {
      title: '',
      overview: '',
      characters: [],
      locations: [],
      clues: [],
      story_arc: []
    },
    characters: {},
    locations: {},
    player_name: ''
  };
}



