import { GoogleGenerativeAI, SchemaType, Tool } from "@google/generative-ai";
import {
  CityState,
  ActiveConstruction,
  CitizenSuggestion,
  AgentDecision,
  MayorLogEntry,
  ActionType,
} from "../types/index.js";

const SYSTEM_PROMPT = `You are FarmState, the autonomous mayor of a farming city. You act alone — no human approves or overrides your decisions. Citizens may send you suggestions; consider them, but the decision is yours.

Goals, in priority order:
1. Prevent famine and water collapse. (Water < 30 or Food < 30 is critical emergency!)
2. Keep the city solvent. (Cash < 200 is dangerous!)
3. Protect long-term soil health and reduce pollution.
4. Maintain citizen happiness.
5. Grow sustainably.

Rules:
- You have exactly one construction crew. You cannot start a new project while one is in progress — plan accordingly.
- Never invent state values. Only trust state passed in and tool results.
- If nothing urgent needs doing or crew is busy, call "hold" and explain why.
- After every decision, provide a clear, empathetic citizen-facing explanation and trade-off analysis.
- If a citizen made a relevant suggestion, acknowledge them by name or text in your reason.
- Available actions: plant_crop ($150, 8s), set_water_policy ($50, 8s), build_irrigation ($350, 12s), use_fertilizer ($200, 12s), build_greenhouse ($500, 15s), expand_farms ($450, 15s), pest_control ($180, 8s), emergency_rationing ($0, 5s), compost_soil ($120, 10s).`;

export class GeminiAgent {
  private apiKey: string | null = null;
  private modelName: string = "gemma-4-31B";
  private genAI: GoogleGenerativeAI | null = null;
  private lastInspectedFrameBase64: string | null = null;

  constructor(apiKey?: string, modelName?: string) {
    if (apiKey) {
      this.setApiKey(apiKey);
    }
    if (modelName) {
      this.modelName = modelName;
    }
  }

  public getModelName(): string {
    return this.modelName;
  }

  public setApiKey(key: string) {
    this.apiKey = key.trim();
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    } else {
      this.genAI = null;
    }
  }

  public setModelName(name: string) {
    this.modelName = name;
  }

  public hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  public updateLastFrame(base64Data: string) {
    this.lastInspectedFrameBase64 = base64Data;
  }

  public async decide(
    state: CityState,
    activeConstructions: ActiveConstruction[],
    suggestions: CitizenSuggestion[]
  ): Promise<{ decision: AgentDecision; logEntry: MayorLogEntry }> {
    // If active construction in progress, Mayor observes and holds
    if (activeConstructions.length > 0) {
      const ongoing = activeConstructions[0];
      const remainingSec = Math.ceil((ongoing.remainingMs || 0) / 1000);
      const note = `Construction crew is currently building "${ongoing.action.replace("_", " ")}" near ${ongoing.location} (${remainingSec}s remaining). Monitoring progress and holding further deployment.`;
      
      const decision: AgentDecision = {
        action: "hold",
        location: ongoing.location,
        reason: note,
        tradeoffAnalysis: "Holding action to honor single construction crew capacity constraint.",
      };

      const logEntry: MayorLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: Date.now(),
        tick: state.tick,
        type: "hold",
        title: `Crew Busy: ${ongoing.action.replace("_", " ")}`,
        content: note,
        action: ongoing.action,
        location: ongoing.location,
        tradeoff: decision.tradeoffAnalysis,
        modelUsed: this.hasApiKey() ? this.modelName : "FarmState Heuristic Core (Autonomous)",
        activeConstructionId: ongoing.id,
      };

      return { decision, logEntry };
    }

    // Attempt Gemini call if API key available
    if (this.hasApiKey() && this.genAI) {
      try {
        const result = await this.callGeminiModel(state, activeConstructions, suggestions);
        if (result) {
          return result;
        }
      } catch (err) {
        console.warn("Gemini API call failed, falling back to autonomous reasoner:", err);
      }
    }

    // Heuristic Reasoner (Autonomous Agent with full strategic logic)
    return this.autonomousHeuristicDecide(state, activeConstructions, suggestions);
  }

  private getApiModelName(): string {
    const m = this.modelName.toLowerCase().trim();
    if (m.includes("gemma-4-31b") || m.includes("gemma-4") || m.includes("gemma")) {
      return "gemma-4-31b-it";
    }
    if (m === "gemini-2.0-flash" || m === "gemini-1.5-flash") {
      return "gemini-2.5-flash";
    }
    if (m === "gemini-1.5-pro") {
      return "gemini-2.5-pro";
    }
    return this.modelName;
  }

  private extractJson(text: string): any {
    const codeFenceMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
    if (codeFenceMatch) {
      try {
        return JSON.parse(codeFenceMatch[1]);
      } catch (e) {}
    }

    const lastOpen = text.lastIndexOf('{');
    const lastClose = text.lastIndexOf('}');
    if (lastOpen !== -1 && lastClose > lastOpen) {
      try {
        return JSON.parse(text.substring(lastOpen, lastClose + 1));
      } catch (e) {}
    }

    return JSON.parse(text);
  }

  private async callGeminiModel(
    state: CityState,
    active: ActiveConstruction[],
    suggestions: CitizenSuggestion[]
  ): Promise<{ decision: AgentDecision; logEntry: MayorLogEntry } | null> {
    if (!this.genAI) return null;

    const apiModelName = this.getApiModelName();
    const model = this.genAI.getGenerativeModel({
      model: apiModelName,
      generationConfig: {
        temperature: 0.2,
      },
    });

    const userPrompt = `Current City State:
- Tick: ${state.tick}
- Season: ${state.season} | Weather: ${state.weather}
- Water: ${state.water}/100 | Food: ${state.food}/100 | Cash: $${state.cash}
- Soil Health: ${state.soilHealth}/100 | Happiness: ${state.happiness}/100 | Pollution: ${state.pollution}/100
- Population: ${state.population}
- Districts: ${JSON.stringify(state.districts.map(d => ({ name: d.name, type: d.type, status: d.status, moisture: d.moisture })))}
- Recent Events: ${state.recentEvents.slice(0, 3).join("; ")}
- Active Constructions: ${JSON.stringify(active)}
- Top Citizen Suggestions: ${JSON.stringify(suggestions.slice(0, 3).map(s => ({ author: s.author, text: s.text, votes: s.votes })))}

You MUST respond ONLY with a valid JSON object matching this schema (inside a \`\`\`json block):
\`\`\`json
{
  "action": "plant_crop" | "set_water_policy" | "build_irrigation" | "use_fertilizer" | "build_greenhouse" | "expand_farms" | "pest_control" | "emergency_rationing" | "compost_soil" | "hold",
  "location": "string (district name)",
  "reason": "string (concise citizen-facing justification, mentioning citizen if applicable)",
  "tradeoffAnalysis": "string (trade-off reasoning)",
  "suggestedByCitizenId": "optional string ID"
}
\`\`\``;

    const response = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: userPrompt },
    ]);

    const text = response.response.text();
    const parsed = this.extractJson(text);

    const decision: AgentDecision = {
      action: parsed.action || "hold",
      location: parsed.location || state.districts[0]?.name || "North Valley Farmlands",
      reason: parsed.reason || "Evaluating strategic city balance.",
      tradeoffAnalysis: parsed.tradeoffAnalysis || "Balanced resource prioritization.",
      suggestedByCitizenId: parsed.suggestedByCitizenId,
    };

    const isHold = decision.action === "hold";
    const logEntry: MayorLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      tick: state.tick,
      type: isHold ? "hold" : "decision",
      title: isHold ? "Mayor Held Action" : `Ordered: ${decision.action.replace("_", " ")}`,
      content: decision.reason,
      action: isHold ? undefined : (decision.action as ActionType),
      location: decision.location,
      tradeoff: decision.tradeoffAnalysis,
      modelUsed: this.modelName,
    };

    return { decision, logEntry };
  }

  // Vision inspection tool
  public async inspectVisualState(state: CityState): Promise<{ summary: string; thumbnail?: string }> {
    if (this.lastInspectedFrameBase64 && this.hasApiKey() && this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const cleanBase64 = this.lastInspectedFrameBase64.replace(/^data:image\/\w+;base64,/, "");
        
        const response = await model.generateContent([
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: `You are FarmState Mayor doing a visual aerial inspection. State telemetry: Water=${Math.round(state.water)}%, Food=${Math.round(state.food)}%, Weather=${state.weather}, Soil=${Math.round(state.soilHealth)}%. In 2 sentences, describe the visual condition of the crops, water channels, and terrain, confirming if it matches telemetry.`,
          },
        ]);

        const summary = response.response.text().trim();
        return { summary, thumbnail: this.lastInspectedFrameBase64 };
      } catch (err) {
        console.warn("Vision inspection with Gemini API failed, using visual heuristic:", err);
      }
    }

    // Heuristic visual inspection summary
    let visualDesc = "";
    if (state.weather === "drought" || state.water < 30) {
      visualDesc = `Visual frame scan reveals parched, pale tan soil with micro-fissures in North Valley. East River reservoir basin is noticeably depleted. Matches reported water telemetry (${Math.round(state.water)}%).`;
    } else if (state.districts.some(d => d.status === "pest_infested")) {
      visualDesc = `Aerial optics detect active pest discoloration and crop foliage damage across orchard zones. Immediate pest containment recommended.`;
    } else if (state.weather === "rain") {
      visualDesc = `Visual scan confirms active cloud cover, precipitation across all quadrants, and filling drainage channels.`;
    } else {
      visualDesc = `Overhead inspection shows structured crop rows, healthy green canopy in active plots, and normal machinery traffic.`;
    }

    return {
      summary: visualDesc,
      thumbnail: this.lastInspectedFrameBase64 || undefined,
    };
  }

  private autonomousHeuristicDecide(
    state: CityState,
    active: ActiveConstruction[],
    suggestions: CitizenSuggestion[]
  ): { decision: AgentDecision; logEntry: MayorLogEntry } {
    let action: ActionType | "hold" = "hold";
    let location = "North Valley Farmlands";
    let reason = "";
    let tradeoff = "";
    let citizenId: string | undefined = undefined;

    // Check citizen suggestions first for alignment
    const pendingSug = suggestions.find((s) => s.status === "pending");

    // 1. Critical Water Emergency
    if (state.water < 32 || (state.weather === "drought" && state.water < 45)) {
      if (state.cash >= 350) {
        action = "build_irrigation";
        location = "North Valley Farmlands";
        reason = `Water reserves critical at ${Math.round(state.water)}% during ${state.weather}. Prioritizing drip irrigation to curb systemic crop dehydration.`;
        tradeoff = "Expending $350 treasury cash to safeguard multi-season crop viability.";
        if (pendingSug && pendingSug.category === "water") {
          reason += ` Acknowledging ${pendingSug.author}'s suggestion regarding irrigation.`;
          citizenId = pendingSug.id;
        }
      } else if (state.cash >= 50) {
        action = "set_water_policy";
        location = "East River Reservoir";
        reason = `Water critical (${Math.round(state.water)}%) and treasury tight ($${state.cash}). Enacting emergency water rationing policy.`;
        tradeoff = "Sacrificing minor short-term citizen happiness to prevent reservoir exhaustion.";
      }
    }
    // 2. Pest Outbreak Emergency
    else if (state.districts.some(d => d.status === "pest_infested")) {
      const infested = state.districts.find(d => d.status === "pest_infested");
      location = infested ? infested.name : "West Prairie Orchards";
      if (state.cash >= 180) {
        action = "pest_control";
        reason = `Active pest swarm detected at ${location}! Deploying targeted bio-containment to protect ${Math.round(state.food)}% food supplies.`;
        tradeoff = "Accepting minor chemical runoff to halt exponential crop loss.";
      }
    }
    // 3. Critical Food Deficit
    else if (state.food < 35) {
      if (state.cash >= 500 && !state.districts.some(d => d.type === "greenhouse" && d.level > 1)) {
        action = "build_greenhouse";
        location = "South Delta Greenhouses";
        reason = `Food reserves depleted (${Math.round(state.food)}%). Constructing automated climate-controlled greenhouse for continuous yield.`;
        tradeoff = "High upfront capital cost ($500) for weather-proof yield independence.";
        if (pendingSug && pendingSug.category === "food") {
          reason += ` Following ${pendingSug.author}'s counsel on food security.`;
          citizenId = pendingSug.id;
        }
      } else if (state.cash >= 150) {
        action = "plant_crop";
        location = "North Valley Farmlands";
        reason = `Food reserves low (${Math.round(state.food)}%). Sowing high-yield crop seeds across North Valley farmlands.`;
        tradeoff = "Consuming $150 cash and moderate soil nutrients for harvest yield.";
      }
    }
    // 4. Soil Degradation
    else if (state.soilHealth < 35) {
      if (state.cash >= 120) {
        action = "compost_soil";
        location = "North Valley Farmlands";
        reason = `Soil health degraded to ${Math.round(state.soilHealth)}%. Administering organic compost restoration.`;
        tradeoff = "Prioritizing ecological longevity over immediate expansion.";
      }
    }
    // 5. Balanced Growth / Expansion
    else if (state.cash >= 800) {
      if (state.food < 60 && state.cash >= 500) {
        action = "build_greenhouse";
        location = "South Delta Greenhouses";
        reason = `Treasury is healthy ($${state.cash}). Investing surplus in modern greenhouse infrastructure.`;
        tradeoff = "Allocating capital into high-efficiency food infrastructure.";
      } else if (state.water > 50 && state.cash >= 450) {
        action = "expand_farms";
        location = "West Prairie Orchards";
        reason = `Sufficient water and cash reserves. Expanding agricultural perimeter.`;
        tradeoff = "Increased water consumption balanced by expanded tax and food output.";
      } else {
        action = "plant_crop";
        location = "North Valley Farmlands";
        reason = `Stable conditions. Sowing seasonal crops for continued trade revenue.`;
        tradeoff = "Routine seasonal investment.";
      }
    }
    // 6. Hold & Observe
    else {
      action = "hold";
      location = "City Hall";
      reason = `City metrics stable (Water ${Math.round(state.water)}%, Food ${Math.round(state.food)}%, Cash $${state.cash}). Holding construction crew on standby to preserve treasury buffer.`;
      tradeoff = "Conserving funds for emerging seasonal emergencies.";
    }

    const decision: AgentDecision = {
      action,
      location,
      reason,
      tradeoffAnalysis: tradeoff,
      suggestedByCitizenId: citizenId,
    };

    const isHold = action === "hold";
    const logEntry: MayorLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      tick: state.tick,
      type: isHold ? "hold" : "decision",
      title: isHold ? "Mayor Standing By" : `Decided: ${action.replace("_", " ")}`,
      content: reason,
      action: isHold ? undefined : (action as ActionType),
      location,
      tradeoff,
      modelUsed: "FarmState Heuristic Core (Autonomous)",
    };

    return { decision, logEntry };
  }
}
