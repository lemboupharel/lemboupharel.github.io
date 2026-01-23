const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());

// --- Storage Configuration ---
let storageMode = "file"; // 'file', 'vercel-kv', 'redis'
let kvClient;

// 1. Try Vercel KV (HTTP)
const hasVercelKV = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// 2. Try Standard Redis (TCP) - Check generic REDIS_URL or the user's specific var
const redisUrl = process.env.REDIS_URL || process.env.portfolio_kv_REDIS_URL;

if (hasVercelKV) {
  const { kv } = require("@vercel/kv");
  kvClient = kv;
  storageMode = "vercel-kv";
  console.log("Using Storage: Vercel KV (HTTP)");
} else if (redisUrl) {
  const Redis = require("ioredis");
  kvClient = new Redis(redisUrl);
  storageMode = "redis";
  console.log("Using Storage: Redis (TCP)");
} else {
  console.log("Using Storage: File System (local fallback)");
}

const DATA_KEY = "portfolio_data";
const DATA_PATH = path.join(__dirname, "..", "data.json");

// --- Helper Functions ---

const getEmptyData = () => ({
  projects: [],
  certificates: [],
  partners: [],
  signals: [],
  admin: { password: "change_me_later" }
});

const readData = async () => {
  try {
    if (storageMode === "vercel-kv") {
      // @vercel/kv automatically parses JSON
      const data = await kvClient.get(DATA_KEY);
      return data || getEmptyData();
    }
    else if (storageMode === "redis") {
      // ioredis returns string, need to parse
      const dataStr = await kvClient.get(DATA_KEY);
      return dataStr ? JSON.parse(dataStr) : getEmptyData();
    }
    else {
      // File system
      if (!fs.existsSync(DATA_PATH)) return getEmptyData();
      const content = fs.readFileSync(DATA_PATH, "utf8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Error reading data (${storageMode}):`, err);
    return getEmptyData();
  }
};

const writeData = async (data) => {
  try {
    if (storageMode === "vercel-kv") {
      await kvClient.set(DATA_KEY, data);
    }
    else if (storageMode === "redis") {
      // ioredis requires string for complex objects
      await kvClient.set(DATA_KEY, JSON.stringify(data));
    }
    else {
      fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    }
    return true;
  } catch (err) {
    console.error(`Error writing data (${storageMode}):`, err);
    return false;
  }
};

// --- Middleware & Routes ---

// Serve static assets
app.use(express.static(path.join(__dirname, "..", "public")));

// Get Data
app.get("/api/data", async (req, res) => {
  try {
    const data = await readData();
    const { admin, ...publicData } = data;
    res.json(publicData);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Admin Login
app.post("/api/admin/login", async (req, res) => {
  try {
    const { password } = req.body;
    const data = await readData();
    if (password === data.admin.password) {
      res.json({ success: true, token: "session_token_placeholder" });
    } else {
      res.status(401).json({ success: false, message: "Invalid password" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// --- CRUD Operations Generator ---
const createCrudEndpoints = (resourceName) => {
  // Create
  app.post(`/api/${resourceName}`, async (req, res) => {
    try {
      const data = await readData();
      if (!data[resourceName]) data[resourceName] = [];

      const newItem = { id: Date.now().toString(), ...req.body };
      data[resourceName].push(newItem);

      await writeData(data);
      res.json(newItem);
    } catch (err) {
      res.status(500).json({ error: `Failed to create ${resourceName} item` });
    }
  });

  // Update
  app.put(`/api/${resourceName}/:id`, async (req, res) => {
    try {
      const data = await readData();
      if (!data[resourceName]) data[resourceName] = [];

      const index = data[resourceName].findIndex(item => item.id === req.params.id);
      if (index !== -1) {
        data[resourceName][index] = { id: req.params.id, ...req.body };
        await writeData(data);
        res.json(data[resourceName][index]);
      } else {
        res.status(404).json({ error: "Item not found" });
      }
    } catch (err) {
      res.status(500).json({ error: `Failed to update ${resourceName} item` });
    }
  });

  // Delete
  app.delete(`/api/${resourceName}/:id`, async (req, res) => {
    try {
      const data = await readData();
      if (!data[resourceName]) data[resourceName] = [];

      data[resourceName] = data[resourceName].filter(item => item.id !== req.params.id);
      await writeData(data);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: `Failed to delete ${resourceName} item` });
    }
  });
};

// Generate Routes
createCrudEndpoints("projects");
createCrudEndpoints("certificates");
createCrudEndpoints("partners");
createCrudEndpoints("signals");

// Seed Data Endpoint
app.post("/api/admin/seed", async (req, res) => {
  try {
    const existingData = await readData();
    if (existingData.projects.length === 0) {
      const seedData = getEmptyData();
      // Add initial seed data here if desired
      seedData.projects.push({
        id: "1",
        title: "Example Project",
        description: "Initial seed data.",
        category: "Demo",
        tags: ["Test"],
        link: "#"
      });
      await writeData(seedData);
      res.json({ success: true, message: "Data seeded successfully" });
    } else {
      res.json({ success: true, message: "Data already exists" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to seed data" });
  }
});

// Page Routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "..", "public", "index.html")));
app.get("/projects", (req, res) => res.sendFile(path.join(__dirname, "..", "public", "projects.html")));
app.get("/certificates", (req, res) => res.sendFile(path.join(__dirname, "..", "public", "certificates.html")));
app.get("/partners", (req, res) => res.sendFile(path.join(__dirname, "..", "public", "partners.html")));
app.get("/contact", (req, res) => res.sendFile(path.join(__dirname, "..", "public", "contact.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "..", "public", "admin.html")));

module.exports = app;

// Local Dev Server
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Current Storage Mode: ${storageMode}`);
  });
}
