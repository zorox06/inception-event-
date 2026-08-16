import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { SimEngine } from "./engine/simEngine.js";
import { GeminiAgent } from "./agent/geminiAgent.js";
import { ReactorService } from "./reactor/reactorService.js";
import { MayorLogEntry } from "./types/index.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json({ limit: "15mb" }));

const PORT = process.env.PORT || 3001;

// Instances
const simEngine = new SimEngine();
const reactorService = new ReactorService();
const geminiAgent = new GeminiAgent(process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL || "gemma-4-31b-it");

const mayorLogs: MayorLogEntry[] = [];

function addMayorLog(entry: MayorLogEntry) {
  mayorLogs.unshift(entry);
  if (mayorLogs.length > 50) {
    mayorLogs.pop();
  }
  io.emit("mayor_log", entry);
}

// Initial welcome log
addMayorLog({
  id: `log_init_${Date.now()}`,
  timestamp: Date.now(),
  tick: 1,
  type: "decision",
  title: "AI Mayor Initialized",
  content: "FarmState Autonomous Mayor online with Gemma 4 31B reasoning core. Monitoring city status and preparing strategic construction orders.",
  modelUsed: geminiAgent.hasApiKey() ? (process.env.GEMINI_MODEL || "gemma-4-31b-it") : "Autonomous Core",
});

// Broadcast current city state to all connected clients
function broadcastState() {
  const state = simEngine.getState();
  io.emit("city_state_update", state);
}

// --- Main Simulation Loop (1-second tick) ---
let lastAgentTickTime = Date.now();

setInterval(() => {
  const state = simEngine.getState();
  if (state.isPaused) return;

  // 1. Advance passive simulation dynamics
  simEngine.simTick();

  // 2. Check and resolve completed active constructions
  const active = simEngine.getActiveConstructions();
  for (const c of active) {
    if (Date.now() >= c.startedAt + c.duration) {
      const { construction, effects } = simEngine.resolve(c);
      const scenePrompt = reactorService.scenePromptComplete(construction, simEngine.getState());

      const logEntry: MayorLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: Date.now(),
        tick: simEngine.getState().tick,
        type: "construction_completed",
        title: `Completed: ${construction.action.replace("_", " ")}`,
        content: `Construction completed at ${construction.location}. Effects realized: ${effects.customNote || "District enhanced."}`,
        action: construction.action,
        location: construction.location,
        modelUsed: "Sim Engine",
      };

      addMayorLog(logEntry);
      io.emit("construction_completed", { construction, effects, scenePrompt });
    }
  }

  // 3. Check if it's time for an Agent Decision Tick
  const speed = state.gameSpeed || 1;
  const agentIntervalMs = Math.max(30000, Math.round(60000 / speed));

  if (Date.now() - lastAgentTickTime >= agentIntervalMs) {
    lastAgentTickTime = Date.now();
    runAgentDecisionCycle();
  }

  broadcastState();
}, 1000);

// Autonomous Agent Decision Loop
async function runAgentDecisionCycle() {
  const state = simEngine.getState();
  if (state.isPaused) return;

  const active = simEngine.getActiveConstructions();
  const suggestions = simEngine.getSuggestions();

  io.emit("agent_thinking", { isThinking: true });

  try {
    const { decision, logEntry } = await geminiAgent.decide(state, active, suggestions);

    if (decision.action === "hold") {
      addMayorLog(logEntry);
      io.emit("agent_thinking", { isThinking: false });
      return;
    }

    // Validate decision with deterministic engine
    const validation = simEngine.validate(decision);
    if (!validation.accepted) {
      const rejectLog: MayorLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: Date.now(),
        tick: state.tick,
        type: "hold",
        title: `Validation Blocked: ${decision.action}`,
        content: `Considered ${decision.action.replace("_", " ")} at ${decision.location}, but: ${validation.reason}`,
        action: decision.action,
        location: decision.location,
        tradeoff: "Engine validation rejected proposed action.",
        modelUsed: logEntry.modelUsed,
      };
      addMayorLog(rejectLog);
      io.emit("agent_thinking", { isThinking: false });
      return;
    }

    // Queue accepted construction
    const construction = simEngine.queueConstruction(validation, decision.reason);
    const scenePrompt = reactorService.scenePromptStart(construction, state);

    // If citizen suggestion was used, mark it
    if (decision.suggestedByCitizenId) {
      simEngine.markSuggestionConsidered(
        decision.suggestedByCitizenId,
        `Adopted by Mayor: ${decision.action.replace("_", " ")}`
      );
      io.emit("citizen_suggestions_update", simEngine.getSuggestions());
    }

    const startLog: MayorLogEntry = {
      ...logEntry,
      type: "construction_started",
      title: `Ordered: ${construction.action.replace("_", " ")}`,
      content: `${decision.reason} (${Math.round(construction.duration / 1000)}s build timer)`,
      activeConstructionId: construction.id,
    };

    addMayorLog(startLog);
    io.emit("construction_started", { construction, scenePrompt });
  } catch (err) {
    console.error("Error in Agent Decision Cycle:", err);
  } finally {
    io.emit("agent_thinking", { isThinking: false });
    broadcastState();
  }
}

// --- REST Endpoints ---

let reactorApiKey: string = process.env.REACTOR_API_KEY || "";

app.get("/api/state", async (req, res) => {
  const jwt = await getReactorJwt();
  res.json({
    state: simEngine.getState(),
    suggestions: simEngine.getSuggestions(),
    mayorLogs,
    reactorPrompts: reactorService.getPromptHistory(),
    hasApiKey: geminiAgent.hasApiKey(),
    hasReactorKey: Boolean(reactorApiKey && reactorApiKey.length > 5),
    reactorToken: jwt || reactorApiKey,
    activeModel: geminiAgent.getModelName(),
  });
});

let cachedReactorJwt = "";
let lastTokenExchangeTime = 0;

async function getReactorJwt(): Promise<string> {
  if (!reactorApiKey) return "";
  if (reactorApiKey.startsWith("ey")) return reactorApiKey;

  const now = Date.now();
  if (cachedReactorJwt && now - lastTokenExchangeTime < 1000 * 60 * 30) {
    return cachedReactorJwt;
  }

  try {
    const r = await fetch("https://api.reactor.inc/tokens", {
      method: "POST",
      headers: {
        "Reactor-API-Key": reactorApiKey,
      },
    });
    if (r.ok) {
      const data: any = await r.json();
      if (data.jwt) {
        cachedReactorJwt = data.jwt;
        lastTokenExchangeTime = now;
        return data.jwt;
      }
    } else {
      const errText = await r.text();
      console.warn(`[Reactor Token Minting] HTTP ${r.status}: ${errText}`);
    }
  } catch (e) {
    console.warn("Reactor token exchange notice:", e);
  }
  return reactorApiKey;
}

app.get("/api/reactor/token", async (req, res) => {
  const jwt = await getReactorJwt();
  res.json({
    jwt,
    token: jwt,
    models: ["reactor/happy-oyster-adventure", "reactor/happy-oyster-director"],
  });
});

app.post("/api/settings", async (req, res) => {
  const { apiKey, model, gameSpeed, isPaused, reactorKey } = req.body;
  if (apiKey !== undefined) {
    geminiAgent.setApiKey(apiKey);
  }
  if (reactorKey !== undefined) {
    reactorApiKey = reactorKey.trim();
    cachedReactorJwt = "";
  }
  if (model !== undefined) {
    geminiAgent.setModelName(model);
  }
  if (gameSpeed !== undefined) {
    simEngine.setGameSpeed(Number(gameSpeed));
  }
  if (isPaused !== undefined) {
    simEngine.setPaused(Boolean(isPaused));
  }

  broadcastState();
  res.json({ 
    success: true, 
    hasApiKey: geminiAgent.hasApiKey(),
    hasReactorKey: Boolean(reactorApiKey && reactorApiKey.length > 5),
  });
});

app.post("/api/suggestions", (req, res) => {
  const { author, avatar, text, category } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Suggestion text required" });
  }

  const suggestion = simEngine.addSuggestion({
    author: author || "Concerned Citizen",
    avatar: avatar || "🧑‍🌾",
    text: text.trim(),
    category: category || "general",
  });

  io.emit("citizen_suggestions_update", simEngine.getSuggestions());
  res.json({ success: true, suggestion });
});

app.post("/api/suggestions/:id/upvote", (req, res) => {
  const success = simEngine.upvoteSuggestion(req.params.id);
  if (success) {
    io.emit("citizen_suggestions_update", simEngine.getSuggestions());
  }
  res.json({ success });
});

app.post("/api/scenario", (req, res) => {
  const { preset } = req.body;
  simEngine.resetScenario(preset || "drought_crisis");
  
  addMayorLog({
    id: `log_scenario_${Date.now()}`,
    timestamp: Date.now(),
    tick: 1,
    type: "event",
    title: `Scenario Loaded: ${preset || "drought_crisis"}`,
    content: `Simulation reset to "${preset}" preset. Mayor assessing new baseline conditions.`,
    modelUsed: "System",
  });

  broadcastState();
  io.emit("citizen_suggestions_update", simEngine.getSuggestions());
  res.json({ success: true, state: simEngine.getState() });
});

app.post("/api/event", (req, res) => {
  const { eventType } = req.body;
  simEngine.triggerEvent(eventType);
  const prompt = reactorService.scenePromptEvent(eventType, simEngine.getState());

  addMayorLog({
    id: `log_event_${Date.now()}`,
    timestamp: Date.now(),
    tick: simEngine.getState().tick,
    type: "event",
    title: `Disaster/Event: ${eventType.replace("_", " ").toUpperCase()}`,
    content: `Emergency alert: ${eventType.replace("_", " ")} triggered across the valley.`,
    modelUsed: "Sim Engine",
  });

  broadcastState();
  io.emit("event_triggered", { eventType, prompt });
  res.json({ success: true, state: simEngine.getState() });
});

app.post("/api/agent/tick", async (req, res) => {
  await runAgentDecisionCycle();
  res.json({ success: true });
});

app.post("/api/agent/vision", async (req, res) => {
  const { frameBase64 } = req.body;
  if (frameBase64) {
    geminiAgent.updateLastFrame(frameBase64);
  }

  const visionResult = await geminiAgent.inspectVisualState(simEngine.getState());

  const logEntry: MayorLogEntry = {
    id: `log_vision_${Date.now()}`,
    timestamp: Date.now(),
    tick: simEngine.getState().tick,
    type: "vision_inspection",
    title: "Mayor Aerial Frame Scan",
    content: visionResult.summary,
    visionSummary: visionResult.summary,
    visionThumbnail: visionResult.thumbnail,
    modelUsed: geminiAgent.hasApiKey() ? "Gemini 2.0 Flash Vision" : "FarmState Visual Scanner",
  };

  addMayorLog(logEntry);
  res.json({ success: true, visionResult, logEntry });
});

// Socket connection handling
io.on("connection", (socket) => {
  socket.emit("city_state_update", simEngine.getState());
  socket.emit("citizen_suggestions_update", simEngine.getSuggestions());
  socket.emit("mayor_log_history", mayorLogs);
  socket.emit("reactor_prompt_history", reactorService.getPromptHistory());

  socket.on("submit_frame", (data: { frameBase64: string }) => {
    if (data.frameBase64) {
      geminiAgent.updateLastFrame(data.frameBase64);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🌾 FarmState Backend Server running on http://localhost:${PORT}`);
  console.log(`🤖 Gemini API Key configured: ${geminiAgent.hasApiKey() ? "YES" : "NO (using Heuristic Core)"}`);
});
