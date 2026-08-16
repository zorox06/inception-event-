import {
  CityState,
  ActiveConstruction,
  ActionType,
  EffectDelta,
  ActionValidation,
  AgentDecision,
  CitizenSuggestion,
  District,
  BASE_DURATIONS,
  ACTION_COSTS,
  BUILD_SLOTS,
  MetricPoint,
} from "../types/index.js";

export class SimEngine {
  private state: CityState;
  private suggestions: CitizenSuggestion[] = [];
  private completedConstructions: ActiveConstruction[] = [];

  constructor() {
    this.state = this.createInitialState("drought_crisis");
    this.seedInitialSuggestions();
  }

  public createInitialState(preset: "drought_crisis" | "pest_outbreak" | "balanced_heartland" | "boomtown" = "drought_crisis"): CityState {
    const defaultDistricts: District[] = [
      {
        id: "district_north",
        name: "North Valley Farmlands",
        type: "cropland",
        status: preset === "drought_crisis" ? "drought_stressed" : "growing",
        level: 1,
        fertility: 45,
        cropType: "wheat",
        moisture: 30,
      },
      {
        id: "district_east",
        name: "East River Reservoir",
        type: "reservoir",
        status: preset === "drought_crisis" ? "drought_stressed" : "irrigating",
        level: 1,
        fertility: 60,
        moisture: 28,
      },
      {
        id: "district_south",
        name: "South Delta Greenhouses",
        type: "greenhouse",
        status: "idle",
        level: 1,
        fertility: 50,
        cropType: "vegetables",
        moisture: 55,
      },
      {
        id: "district_west",
        name: "West Prairie Orchards",
        type: "orchard",
        status: preset === "pest_outbreak" ? "pest_infested" : "idle",
        level: 1,
        fertility: 42,
        cropType: "corn",
        moisture: 40,
      },
    ];

    let base: Partial<CityState> = {
      tick: 1,
      season: "summer",
      weather: "drought",
      water: 28,
      food: 50,
      cash: 700,
      soilHealth: 42,
      happiness: 56,
      pollution: 25,
      population: 1450,
      recentEvents: ["Drought emergency active: Reservoir levels dropping critical"],
      lastVisualEvent: "Dry cracked earth and low reservoir water in North Valley",
      districts: defaultDistricts,
      activeConstructions: [],
      metricsHistory: [],
      gameSpeed: 1,
      isPaused: false,
    };

    if (preset === "pest_outbreak") {
      base = {
        ...base,
        season: "fall",
        weather: "clear",
        water: 55,
        food: 38,
        cash: 950,
        soilHealth: 34,
        happiness: 45,
        pollution: 30,
        population: 1600,
        recentEvents: ["Locust pest outbreak detected across West Prairie Orchards!"],
        lastVisualEvent: "Pest swarms degrading crop fields in West Prairie",
      };
    } else if (preset === "balanced_heartland") {
      base = {
        ...base,
        season: "spring",
        weather: "clear",
        water: 65,
        food: 65,
        cash: 1200,
        soilHealth: 60,
        happiness: 65,
        pollution: 20,
        population: 1800,
        recentEvents: ["Spring planting season underway. Reservoirs healthy."],
        lastVisualEvent: "Lush green sprouts emerging across North Valley",
      };
    } else if (preset === "boomtown") {
      base = {
        ...base,
        season: "summer",
        weather: "clear",
        water: 40,
        food: 75,
        cash: 2500,
        soilHealth: 48,
        happiness: 72,
        pollution: 55,
        population: 3200,
        recentEvents: ["Rapid population growth increasing water demand"],
        lastVisualEvent: "Active agricultural machinery expanding perimeter",
      };
    }

    const stateObj = base as CityState;
    stateObj.metricsHistory = [this.recordMetric(stateObj)];
    return stateObj;
  }

  private recordMetric(s: CityState): MetricPoint {
    return {
      tick: s.tick,
      water: Math.round(s.water),
      food: Math.round(s.food),
      cash: Math.round(s.cash),
      soilHealth: Math.round(s.soilHealth),
      happiness: Math.round(s.happiness),
      pollution: Math.round(s.pollution),
    };
  }

  private seedInitialSuggestions() {
    this.suggestions = [
      {
        id: "sug_1",
        author: "Farmer Henderson",
        avatar: "👨‍🌾",
        text: "The drought is killing the wheat in North Valley! We urgently need drip irrigation.",
        category: "water",
        votes: 18,
        createdAt: Date.now() - 60000,
        status: "pending",
      },
      {
        id: "sug_2",
        author: "Councilwoman Elena",
        avatar: "👩‍💼",
        text: "Citizens are worried about food prices and winter reserves. Can we prioritize greenhouse expansion?",
        category: "food",
        votes: 12,
        createdAt: Date.now() - 35000,
        status: "pending",
      },
      {
        id: "sug_3",
        author: "Ecologist Clara",
        avatar: "🔬",
        text: "Avoid excessive chemical fertilizers—our topsoil microbiome is at risk of collapse.",
        category: "environment",
        votes: 7,
        createdAt: Date.now() - 15000,
        status: "pending",
      },
    ];
  }

  public getState(): CityState {
    // Update active construction progress
    const now = Date.now();
    const updatedConstructions = this.state.activeConstructions.map((c) => {
      const elapsed = now - c.startedAt;
      const remainingMs = Math.max(0, c.duration - elapsed);
      const progressPercent = Math.min(100, Math.round((elapsed / c.duration) * 100));
      return {
        ...c,
        remainingMs,
        progressPercent,
      };
    });

    return {
      ...this.state,
      activeConstructions: updatedConstructions,
    };
  }

  public getActiveConstructions(): ActiveConstruction[] {
    return this.getState().activeConstructions;
  }

  public getSuggestions(): CitizenSuggestion[] {
    return this.suggestions;
  }

  public addSuggestion(s: Omit<CitizenSuggestion, "id" | "votes" | "createdAt" | "status">): CitizenSuggestion {
    const newSug: CitizenSuggestion = {
      ...s,
      id: `sug_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      votes: 1,
      createdAt: Date.now(),
      status: "pending",
    };
    this.suggestions.unshift(newSug);
    return newSug;
  }

  public upvoteSuggestion(id: string): boolean {
    const sug = this.suggestions.find((s) => s.id === id);
    if (sug) {
      sug.votes += 1;
      return true;
    }
    return false;
  }

  public markSuggestionConsidered(id: string, note?: string) {
    const sug = this.suggestions.find((s) => s.id === id);
    if (sug) {
      sug.status = "considered";
      if (note) sug.mayorResponse = note;
    }
  }

  public setGameSpeed(speed: number) {
    const oldSpeed = this.state.gameSpeed || 1;
    this.state.gameSpeed = speed;

    // Rescale running constructions
    const now = Date.now();
    this.state.activeConstructions = this.state.activeConstructions.map((c) => {
      const elapsedOld = (now - c.startedAt);
      // Recalculate duration based on new speed
      const newDuration = Math.round(c.baseDuration / speed);
      // Scale elapsed time proportionally so progress is preserved
      const newStartedAt = now - Math.round((elapsedOld / c.duration) * newDuration);
      return {
        ...c,
        startedAt: newStartedAt,
        duration: newDuration,
      };
    });
  }

  public setPaused(paused: boolean) {
    this.state.isPaused = paused;
  }

  public resetScenario(preset: "drought_crisis" | "pest_outbreak" | "balanced_heartland" | "boomtown") {
    this.state = this.createInitialState(preset);
    this.seedInitialSuggestions();
  }

  public triggerEvent(eventType: "pest_outbreak" | "heatwave" | "sudden_rain" | "market_boom") {
    switch (eventType) {
      case "pest_outbreak":
        this.state.districts.forEach((d) => {
          if (d.type === "cropland" || d.type === "orchard") {
            d.status = "pest_infested";
          }
        });
        this.state.food = Math.max(10, this.state.food - 18);
        this.state.soilHealth = Math.max(10, this.state.soilHealth - 12);
        this.state.happiness = Math.max(15, this.state.happiness - 10);
        this.state.recentEvents.unshift("⚠️ Severe pest outbreak! Crops in cropland and orchards are being consumed.");
        this.state.lastVisualEvent = "Locust swarm active over farm districts";
        break;

      case "heatwave":
        this.state.weather = "drought";
        this.state.water = Math.max(5, this.state.water - 20);
        this.state.recentEvents.unshift("☀️ Intense heatwave sweeps over the valley! Water evaporation surging.");
        this.state.lastVisualEvent = "Heat haze shimmering over parched valley soil";
        break;

      case "sudden_rain":
        this.state.weather = "rain";
        this.state.water = Math.min(100, this.state.water + 30);
        this.state.recentEvents.unshift("🌧️ Torrential rainfall revitalizes the reservoirs and fields!");
        this.state.lastVisualEvent = "Heavy rain filling the reservoir basins";
        break;

      case "market_boom":
        this.state.cash += 450;
        this.state.happiness = Math.min(100, this.state.happiness + 8);
        this.state.recentEvents.unshift("💰 Agricultural commodities market surged! Grain export prices up +35%.");
        this.state.lastVisualEvent = "Merchant trade trucks arriving in city center";
        break;
    }
  }

  public validate(decision: AgentDecision): ActionValidation {
    if (decision.action === "hold") {
      return { accepted: true };
    }

    if (this.state.activeConstructions.length >= BUILD_SLOTS) {
      return {
        accepted: false,
        reason: `Construction crew is busy with ${this.state.activeConstructions[0].action}`,
      };
    }

    const cost = ACTION_COSTS[decision.action] || 0;
    if (this.state.cash < cost) {
      return {
        accepted: false,
        reason: `Insufficient treasury funds. Need $${cost}, but city only has $${this.state.cash}`,
      };
    }

    // Determine effects based on action
    const effects = this.calculateActionEffects(decision.action, decision.location);

    return {
      accepted: true,
      cost,
      action: decision.action,
      location: decision.location,
      effects,
    };
  }

  private calculateActionEffects(action: ActionType, location: string): EffectDelta {
    const delta: EffectDelta = {};

    switch (action) {
      case "build_irrigation":
        delta.water = +18;
        delta.soilHealth = +8;
        delta.happiness = +6;
        delta.cash = -350;
        delta.customNote = "Drip irrigation completed: permanently reduces water loss and stabilizes soil.";
        break;

      case "plant_crop":
        delta.food = +22;
        delta.water = -10;
        delta.soilHealth = -4;
        delta.cash = -150;
        delta.customNote = "Crop seeded: will yield substantial food harvest.";
        break;

      case "set_water_policy":
        delta.water = +14;
        delta.happiness = -4;
        delta.cash = -50;
        delta.customNote = "Water conservation rationing enacted: reserves conserved.";
        break;

      case "use_fertilizer":
        delta.food = +16;
        delta.soilHealth = -8;
        delta.pollution = +14;
        delta.cash = -200;
        delta.customNote = "Fertilizer applied: fast crop boost at cost of soil acidity and runoff.";
        break;

      case "build_greenhouse":
        delta.food = +25;
        delta.water = -6;
        delta.happiness = +8;
        delta.cash = -500;
        delta.customNote = "Hydroponic greenhouse built: continuous weather-immune food production.";
        break;

      case "expand_farms":
        delta.food = +18;
        delta.water = -14;
        delta.pollution = +6;
        delta.cash = -450;
        delta.customNote = "Farming acreage expanded: higher potential output.";
        break;

      case "pest_control":
        delta.food = +12;
        delta.pollution = +8;
        delta.happiness = +5;
        delta.cash = -180;
        delta.customNote = "Targeted pest containment cleared crop infesting swarms.";
        break;

      case "emergency_rationing":
        delta.food = +10;
        delta.happiness = -12;
        delta.cash = 0;
        delta.customNote = "Emergency food rationing enforced.";
        break;

      case "compost_soil":
        delta.soilHealth = +18;
        delta.pollution = -6;
        delta.happiness = +4;
        delta.cash = -120;
        delta.customNote = "Organic regenerative compost enriched soil microbiome.";
        break;
    }

    return delta;
  }

  public queueConstruction(validation: ActionValidation, reason: string): ActiveConstruction {
    if (!validation.accepted || !validation.action) {
      throw new Error("Cannot queue invalid construction");
    }

    const action = validation.action;
    const baseDuration = BASE_DURATIONS[action] || 10000;
    const speed = this.state.gameSpeed || 1;
    const duration = Math.round(baseDuration / speed);
    const location = validation.location || "North Valley Farmlands";

    // Deduct upfront cost
    if (validation.cost) {
      this.state.cash -= validation.cost;
    }

    const construction: ActiveConstruction = {
      id: `build_${Date.now()}`,
      action,
      location,
      startedAt: Date.now(),
      duration,
      baseDuration,
      effects: validation.effects || {},
      reason,
    };

    this.state.activeConstructions.push(construction);

    // Update target district status
    const targetDistrict = this.state.districts.find((d) => d.name === location || d.id === location) || this.state.districts[0];
    if (targetDistrict) {
      targetDistrict.status = "under_construction";
    }

    this.state.recentEvents.unshift(`🔨 Construction started: ${action.replace("_", " ")} at ${location}`);
    this.state.lastVisualEvent = `Active construction crew deployed at ${location}`;

    return construction;
  }

  public resolve(construction: ActiveConstruction): { construction: ActiveConstruction; effects: EffectDelta } {
    // Remove from active
    this.state.activeConstructions = this.state.activeConstructions.filter((c) => c.id !== construction.id);
    this.completedConstructions.push(construction);

    const eff = construction.effects;

    // Apply deltas with clamping
    if (eff.water !== undefined) this.state.water = Math.max(0, Math.min(100, this.state.water + eff.water));
    if (eff.food !== undefined) this.state.food = Math.max(0, Math.min(100, this.state.food + eff.food));
    if (eff.cash !== undefined && eff.cash > 0) this.state.cash += eff.cash; // costs were already deducted
    if (eff.soilHealth !== undefined) this.state.soilHealth = Math.max(0, Math.min(100, this.state.soilHealth + eff.soilHealth));
    if (eff.happiness !== undefined) this.state.happiness = Math.max(0, Math.min(100, this.state.happiness + eff.happiness));
    if (eff.pollution !== undefined) this.state.pollution = Math.max(0, Math.min(100, this.state.pollution + eff.pollution));
    if (eff.population !== undefined) this.state.population = Math.max(100, this.state.population + eff.population);

    // Restore and enhance district status
    const targetDistrict = this.state.districts.find((d) => d.name === construction.location || d.id === construction.location) || this.state.districts[0];
    if (targetDistrict) {
      targetDistrict.level += 1;
      if (construction.action === "build_irrigation") {
        targetDistrict.status = "irrigating";
        targetDistrict.moisture = Math.min(100, targetDistrict.moisture + 35);
      } else if (construction.action === "plant_crop") {
        targetDistrict.status = "growing";
      } else if (construction.action === "pest_control") {
        targetDistrict.status = "growing";
      } else {
        targetDistrict.status = "idle";
      }
    }

    const note = eff.customNote || `Completed ${construction.action.replace("_", " ")}`;
    this.state.recentEvents.unshift(`✅ ${note}`);
    this.state.lastVisualEvent = `Finished ${construction.action.replace("_", " ")} at ${construction.location}`;

    // Trim recent events
    if (this.state.recentEvents.length > 20) {
      this.state.recentEvents = this.state.recentEvents.slice(0, 20);
    }

    return { construction, effects: eff };
  }

  // Periodic passive tick (e.g. called every 1s or on sim tick)
  public simTick(): CityState {
    if (this.state.isPaused) {
      return this.getState();
    }

    this.state.tick += 1;
    const speed = this.state.gameSpeed || 1;

    // --- Realistic Resource Dynamics ---
    // 1. Water Dynamics (Reservoir evaporation vs rainfall)
    const isDrought = this.state.weather === "drought";
    const isRain = this.state.weather === "rain";
    const isSummer = this.state.season === "summer";
    const isWinter = this.state.season === "winter";

    let waterDelta = 0;
    if (isRain) {
      waterDelta += 0.4; // steady gentle replenishment
    } else if (isDrought) {
      waterDelta -= 0.25; // accelerated evaporation
    } else if (isSummer) {
      waterDelta -= 0.12; // warm summer evaporation
    } else if (isWinter) {
      waterDelta += 0.05; // low evaporation
    } else {
      waterDelta -= 0.08; // mild baseline consumption
    }

    // Irrigation consumption
    const irrigationsCount = this.state.districts.filter((d) => d.status === "irrigating").length;
    waterDelta -= irrigationsCount * 0.06;

    this.state.water = Math.max(0, Math.min(100, this.state.water + waterDelta * speed));

    // 2. Realistic Food Production vs Consumption
    // Consumption: proportional to population (~15 units per 1000 people per min)
    const foodConsumption = ((this.state.population / 1000) * 0.04) * speed;
    
    // Production: based on healthy croplands, orchards, greenhouses, and soil health
    const healthyFarms = this.state.districts.filter((d) => d.type === "cropland" && d.status !== "pest_infested").length;
    const healthyOrchards = this.state.districts.filter((d) => d.type === "orchard" && d.status !== "pest_infested").length;
    const greenhouses = this.state.districts.filter((d) => d.type === "greenhouse").length;
    
    const soilMultiplier = Math.max(0.2, this.state.soilHealth / 100);
    const waterMultiplier = this.state.water < 20 ? 0.3 : this.state.water < 50 ? 0.7 : 1.0;
    
    const baseProduction = (healthyFarms * 0.12 + healthyOrchards * 0.08 + greenhouses * 0.25) * soilMultiplier * waterMultiplier * speed;
    this.state.food = Math.max(0, Math.min(100, this.state.food - foodConsumption + baseProduction));

    // 3. Treasury (Tax revenue vs Infrastructure upkeep)
    const taxRevenue = (this.state.population * (this.state.happiness / 100) * 0.005) * speed;
    const maintenanceCost = (1.0 + this.state.districts.reduce((acc, d) => acc + d.level * 0.3, 0)) * speed;
    this.state.cash = Math.max(0, Math.round(this.state.cash + taxRevenue - maintenanceCost));

    // 4. Soil health degradation under drought or recovery with irrigation
    if (isDrought && this.state.water < 25) {
      this.state.soilHealth = Math.max(0, this.state.soilHealth - 0.05 * speed);
    } else if (isRain || irrigationsCount > 0) {
      this.state.soilHealth = Math.min(100, this.state.soilHealth + 0.02 * speed);
    }

    // 5. Pollution natural dissipation
    this.state.pollution = Math.max(0, this.state.pollution - 0.03 * speed);

    // 6. Happiness calculation based on basic needs
    const waterScore = Math.min(100, this.state.water * 1.1);
    const foodScore = Math.min(100, this.state.food * 1.1);
    const healthScore = this.state.soilHealth;
    const pollutionPenalty = this.state.pollution * 0.3;
    const targetHappiness = Math.max(0, Math.min(100, (waterScore + foodScore + healthScore) / 3 - pollutionPenalty));
    this.state.happiness = Math.round(this.state.happiness * 0.96 + targetHappiness * 0.04);

    // Season rotation every 180 ticks (3 minutes per season for stable arcs)
    if (this.state.tick % 180 === 0) {
      const seasons: ("spring" | "summer" | "fall" | "winter")[] = ["spring", "summer", "fall", "winter"];
      const currentIdx = seasons.indexOf(this.state.season);
      this.state.season = seasons[(currentIdx + 1) % seasons.length];
      this.state.recentEvents.unshift(`🍂 Season transitioned to ${this.state.season.toUpperCase()}`);
    }

    // Weather change every 120 ticks (2 minutes for visual continuity)
    if (this.state.tick % 120 === 0) {
      const rand = Math.random();
      if (rand < 0.2) this.state.weather = "rain";
      else if (rand < 0.35 && this.state.season === "summer") this.state.weather = "drought";
      else this.state.weather = "clear";
    }

    // Record history metric point
    if (this.state.tick % 3 === 0) {
      this.state.metricsHistory.push(this.recordMetric(this.state));
      if (this.state.metricsHistory.length > 50) {
        this.state.metricsHistory.shift();
      }
    }

    return this.getState();
  }
}
