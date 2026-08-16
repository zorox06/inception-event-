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
  fertility: number; // 0-100
  cropType?: "wheat" | "corn" | "soy" | "vegetables";
  moisture: number; // 0-100
}

export interface ActiveConstruction {
  id: string;
  action: ActionType;
  location: string;
  startedAt: number;   // epoch ms
  duration: number;    // ms, dynamically adjusted by game speed
  baseDuration: number;// original duration at 1x
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
  water: number;      // 0-100
  food: number;       // 0-100
  cash: number;
  soilHealth: number; // 0-100
  happiness: number;  // 0-100
  pollution: number;  // 0-100
  population: number;
  recentEvents: string[];
  lastVisualEvent: string;
  districts: District[];
  activeConstructions: ActiveConstruction[];
  metricsHistory: MetricPoint[];
  gameSpeed: number; // 1, 2, 5, 10
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

export interface ActionValidation {
  accepted: boolean;
  reason?: string;
  cost?: number;
  action?: ActionType;
  location?: string;
  effects?: EffectDelta;
}

export interface AgentDecision {
  action: ActionType | "hold";
  location: string;
  reason: string;
  tradeoffAnalysis?: string;
  suggestedByCitizenId?: string;
}

export const BUILD_SLOTS = 1; // single construction crew

export const BASE_DURATIONS: Record<ActionType, number> = {
  plant_crop: 8000,
  set_water_policy: 8000,
  build_irrigation: 12000,
  use_fertilizer: 12000,
  build_greenhouse: 15000,
  expand_farms: 15000,
  pest_control: 8000,
  emergency_rationing: 5000,
  compost_soil: 10000,
};

export const ACTION_COSTS: Record<ActionType, number> = {
  plant_crop: 150,
  set_water_policy: 50,
  build_irrigation: 350,
  use_fertilizer: 200,
  build_greenhouse: 500,
  expand_farms: 450,
  pest_control: 180,
  emergency_rationing: 0,
  compost_soil: 120,
};
