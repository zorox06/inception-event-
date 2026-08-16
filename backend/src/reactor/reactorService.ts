import { ActiveConstruction, CityState } from "../types/index.js";

export interface ReactorPromptRecord {
  id: string;
  timestamp: number;
  type: "start" | "complete" | "event" | "ambient";
  prompt: string;
  constructionId?: string;
  cameraPerspective: string;
}

export class ReactorService {
  private promptHistory: ReactorPromptRecord[] = [];
  private sessionId: string;
  private isConnected: boolean = false;

  constructor() {
    this.sessionId = `reactor_sess_${Date.now()}`;
    this.isConnected = true;
    this.logPrompt(
      "ambient",
      "A high-angle 2.5D isometric view of FarmState, a living autonomous agricultural settlement surrounded by golden crop fields, water reservoir basins, granary silos, and greenhouses. Warm sunlight, gentle atmospheric haze, consistent isometric camera angle."
    );
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getPromptHistory(): ReactorPromptRecord[] {
    return this.promptHistory;
  }

  public scenePromptStart(c: ActiveConstruction, state: CityState): string {
    const prompt = `Construction beginning: ${c.action.replace("_", " ")} near ${c.location}. Materials and heavy agricultural equipment are being deployed. Workers are grading the terrain and marking boundaries. Preserve isometric overhead layout, camera angle, lighting, and visual continuity with the existing city.`;
    
    this.logPrompt("start", prompt, c.id);
    return prompt;
  }

  public scenePromptComplete(c: ActiveConstruction, state: CityState): string {
    const droughtNote = state.weather === "drought" ? "The surrounding soil remains visibly dry and cracked with heat haze." : "Lush vegetation and active water channels are visible.";
    const prompt = `The ${c.action.replace("_", " ")} near ${c.location} is now fully built and operational. ${droughtNote} Farm workers are clearing tools and running initial tests. Preserve continuity, perspective, and architectural style of the farming settlement.`;
    
    this.logPrompt("complete", prompt, c.id);
    return prompt;
  }

  public scenePromptEvent(eventTitle: string, state: CityState): string {
    const prompt = `Environmental event update: ${eventTitle}. Current weather is ${state.weather} in ${state.season}. Show atmospheric weather overlay, sunlight direction, and visual response in crop fields near ${state.districts[0]?.name || "valley"}. Preserve global camera perspective.`;
    
    this.logPrompt("event", prompt);
    return prompt;
  }

  private logPrompt(type: "start" | "complete" | "event" | "ambient", prompt: string, constructionId?: string) {
    const record: ReactorPromptRecord = {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      type,
      prompt,
      constructionId,
      cameraPerspective: "Isometric 45° Southwest tilt, high-angle panoramic farm city view",
    };
    this.promptHistory.unshift(record);
    if (this.promptHistory.length > 30) {
      this.promptHistory = this.promptHistory.slice(0, 30);
    }
  }
}
