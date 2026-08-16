export type Season = "spring" | "summer" | "fall" | "winter";
export type Weather = "clear" | "rain" | "drought" | "storm";

export type ActionType =
  | "plant_crop"
  | "set_water_policy"
  | "build_irrigation"
  | "use_fertilizer"
  | "build_greenhouse"
  | "expand_farms"
  | "pest_control"
  | "emergency_rationing"
  | "compost_soil";

export interface EffectDelta {
  water?: number;
  food?: number;
  cash?: number;
  soilHealth?: number;
  happiness?: number;
  pollution?: number;
  population?: number;
  customNote?: string;
}

export interface District {
  id: string;
  name: string;
  type: "cropland" | "reservoir" | "greenhouse" | "orchard" | "residential" | "compost";
  status: "idle" | "growing" | "irrigating" | "under_construction" | "drought_stressed" | "pest_infested";
  level: number;
  fertility: number;
  cropType?: "wheat" | "corn" | "soy" | "vegetables";
  moisture: number;
}

export interface ActiveConstruction {
  id: string;
  action: ActionType;
  location: string;
  startedAt: number;
  duration: number;
  baseDuration: number;
  remainingMs?: number;
  progressPercent?: number;
  effects: EffectDelta;
  reason: string;
}

export interface MetricPoint {
  tick: number;
  water: number;
  food: number;
  cash: number;
  soilHealth: number;
  happiness: number;
  pollution: number;
}

export interface CityState {
  tick: number;
  season: Season;
  weather: Weather;
  water: number;
  food: number;
  cash: number;
  soilHealth: number;
  happiness: number;
  pollution: number;
  population: number;
  recentEvents: string[];
  lastVisualEvent: string;
  districts: District[];
  activeConstructions: ActiveConstruction[];
  metricsHistory: MetricPoint[];
  gameSpeed: number;
  isPaused: boolean;
}

export interface CitizenSuggestion {
  id: string;
  author: string;
  avatar: string;
  text: string;
  category: "food" | "water" | "economy" | "environment" | "general";
  votes: number;
  createdAt: number;
  status: "pending" | "considered" | "adopted" | "rejected";
  mayorResponse?: string;
}

export interface MayorLogEntry {
  id: string;
  timestamp: number;
  tick: number;
  type:
    | "decision"
    | "hold"
    | "construction_started"
    | "construction_completed"
    | "vision_inspection"
    | "event"
    | "citizen_reply";
  title: string;
  content: string;
  action?: ActionType;
  location?: string;
  tradeoff?: string;
  visionSummary?: string;
  visionThumbnail?: string;
  modelUsed?: string;
  activeConstructionId?: string;
}

export interface ReactorPromptRecord {
  id: string;
  timestamp: number;
  type: "start" | "complete" | "event" | "ambient";
  prompt: string;
  constructionId?: string;
  cameraPerspective: string;
}
