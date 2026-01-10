// server.js
import "dotenv/config";
import express from "express";
import vision from "@google-cloud/vision";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vocabulary CSV mapping for reading module
const VOCAB_FILES = {
  elementary: "elementary_voc.csv",
  intermediate: "intermediate_voc.csv",
};

// 🔑 Google credentials - Force correct path to avoid any overrides
const credentialsPath = path.join(__dirname, "sld-dys-new-726f5e0802c4.json");
process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;

console.log("🔑 FORCED Google credentials path:", process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log("📁 Current working directory:", __dirname);
console.log("📄 Credentials file exists:", fs.existsSync(credentialsPath));

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// ---------------- SAFETY HELPERS ----------------
function safeNumber(v) {
  return typeof v === "number" && isFinite(v) ? v : 0;
}

function polyToBBox(box) {
  const xs = box.map(p => p[0] ?? 0);
  const ys = box.map(p => p[1] ?? 0);
  return [
    Math.min(...xs),
    Math.min(...ys),
    Math.max(...xs),
    Math.max(...ys),
  ];
}

function angleBetween(p1, p2) {
  if (!p1 || !p2) return 0;
  const dy = (p2.y ?? 0) - (p1.y ?? 0);
  const dx = (p2.x ?? 0) - (p1.x ?? 0) || 1e-6;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

// ---------------- FEATURE EXTRACTION ----------------
function computeFeatures(chars) {
  if (!chars || chars.length < 2) {
    return {
      spacing_norm: 0,
      irregular_letter_ratio: 0,
      baseline_norm: 0,
      height_inconsistency_norm: 0,
      skew_angle: 0,
    };
  }

  const heights = chars.map(c => {
    const [, y0, , y1] = polyToBBox(c.box);
    return Math.max(1, y1 - y0);
  });

  const meanH =
    heights.reduce((a, b) => a + b, 0) / heights.length || 1;

  const variance =
    heights.reduce((s, h) => s + (h - meanH) ** 2, 0) / heights.length;

  const std = Math.sqrt(variance) || 0;

  const irregular =
    heights.filter(h => Math.abs(h - meanH) > 0.25 * meanH).length /
    heights.length;

  const lowers = chars
    .map(c => {
      const [x0, , , y1] = polyToBBox(c.box);
      return { x: x0, y: y1 };
    })
    .sort((a, b) => a.x - b.x);

  return {
    spacing_norm: safeNumber(std / meanH),
    irregular_letter_ratio: safeNumber(irregular),
    baseline_norm: safeNumber(std / meanH),
    height_inconsistency_norm: safeNumber(std / meanH),
    skew_angle: safeNumber(
      angleBetween(lowers[0], lowers[lowers.length - 1])
    ),
  };
}

// ---------------- VOCAB ENDPOINT ----------------
app.get("/vocab/:level", (req, res) => {
  try {
    const { level } = req.params;
    console.log(`[VOCAB] Request for level: ${level}`);
    const filename = VOCAB_FILES[level];
    if (!filename) {
      console.log(`[VOCAB] Invalid level: ${level}`);
      return res.status(404).json({ error: "Invalid level" });
    }
    const csvPath = path.join(__dirname, filename);
    console.log(`[VOCAB] Reading file: ${csvPath}`);
    
    if (!fs.existsSync(csvPath)) {
      console.error(`[VOCAB] File not found: ${csvPath}`);
      return res.status(404).json({ error: `CSV file not found: ${filename}` });
    }
    
    const content = fs.readFileSync(csvPath, "utf8");
    
    let words = [];
    
    if (level === "elementary") {
      // Elementary: one word per line, filter out non-word entries
      words = content
        .split(/\r?\n/)
        .map((w) => w.trim())
        .filter((w) => {
          // Filter out numbers, empty strings, and header-like entries
          if (!w || /^\d+$/.test(w)) return false;
          const lower = w.toLowerCase();
          const skipWords = ["easy", "english", "nouns", "listen", "read", "example", "phrase", "audio", "the", "what"];
          if (skipWords.includes(lower)) return false;
          // Only keep words that are alphabetic (may have spaces for phrases)
          return /^[a-zA-Z\s]+$/.test(w) && w.length > 1;
        });
    } else if (level === "intermediate") {
      // Intermediate: comma-separated words in line 2
      const lines = content.split(/\r?\n/);
      if (lines.length >= 2) {
        // Line 2 (index 1) contains all comma-separated words
        const wordLine = lines[1];
        words = wordLine
          .split(",")
          .map((w) => w.trim())
          .filter((w) => {
            // Filter out empty, numbers, and very short entries
            if (!w || w.length < 2) return false;
            // Remove trailing spaces and clean up
            return /^[a-zA-Z\s]+$/.test(w);
          });
      }
    }
    
    // Remove duplicates and sort
    words = [...new Set(words)].sort();
    
    // Take 10 random words for the test
    const shuffledWords = words.sort(() => Math.random() - 0.5);
    const randomWords = shuffledWords.slice(0, 10);
    
    console.log(`[VOCAB] Loaded ${words.length} total words, selected ${randomWords.length} random words for level: ${level}`);
    return res.json({ level, words: randomWords, count: randomWords.length });
  } catch (err) {
    console.error("[VOCAB] Error reading vocab:", err);
    return res.status(500).json({ error: `Failed to load vocabulary: ${err.message}` });
  }
});

// ---------------- API ----------------
app.post("/extract", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const [result] = await client.documentTextDetection({
      image: { content: imageBase64 },
    });

    const chars = [];
    result?.fullTextAnnotation?.pages?.forEach(page =>
      page.blocks?.forEach(block =>
        block.paragraphs?.forEach(p =>
          p.words?.forEach(w =>
            w.symbols?.forEach(s =>
              chars.push({
                box: s.boundingBox.vertices.map(v => [
                  v.x ?? 0,
                  v.y ?? 0,
                ]),
              })
            )
          )
        )
      )
    );

    const handwritingFeatures = computeFeatures(chars);
    const extractedText = result?.fullTextAnnotation?.text || "";

    // 🔑 SEND ONLY CLEAN NUMBERS
    const flaskRes = await fetch("http://127.0.0.1:6000/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        extracted_text: extractedText,
        features: handwritingFeatures,
      }),
    });

    if (!flaskRes.ok) {
      const errorText = await flaskRes.text();
      throw new Error(`Flask API error (${flaskRes.status}): ${errorText}`);
    }

    const flaskJson = await flaskRes.json();
    res.status(200).json(flaskJson);

  } catch (err) {
    console.error("Node error:", err);
    const errorMessage = err.message || "Unknown error occurred";
    console.error("Full error:", err);
    
    // Check if it's a connection error to Flask
    if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        features: {},
        prediction: null,
        shap: {},
        error: "Flask API server (port 6000) is not running. Please start it first.",
      });
    }
    
    res.status(500).json({
      features: {},
      prediction: null,
      shap: {},
      error: `Server error: ${errorMessage}`,
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.listen(PORT, () => {
  console.log("✅ Node server running on http://localhost:5000");
});
