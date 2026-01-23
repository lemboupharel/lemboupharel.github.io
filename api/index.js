const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());

const DATA_PATH = path.join(__dirname, "..", "data.json");

// Helper to read data
const readData = () => {
  try {
    const content = fs.readFileSync(DATA_PATH, "utf8");
    return JSON.parse(content);
  } catch (err) {
    return { projects: [], certificates: [], admin: { password: "admin" } };
  }
};

// Helper to write data
const writeData = (data) => {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
};

// serve static assets from /public
app.use(express.static(path.join(__dirname, "..", "public")));

// API Endpoints
app.get("/api/data", (req, res) => {
  const data = readData();
  const { admin, ...publicData } = data;
  res.json(publicData);
});

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  const data = readData();
  if (password === data.admin.password) {
    res.json({ success: true, token: "session_token_placeholder" });
  } else {
    res.status(401).json({ success: false, message: "Invalid password" });
  }
});

app.post("/api/projects", (req, res) => {
  // Simple auth check placeholder
  const data = readData();
  const newProject = { id: Date.now().toString(), ...req.body };
  data.projects.push(newProject);
  writeData(data);
  res.json(newProject);
});

// routes for pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});
app.get("/projects", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "projects.html"));
});
app.get("/certificates", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "certificates.html"));
});
app.get("/partners", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "partners.html"));
});
app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "contact.html"));
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "admin.html"));
});

// Export the Express app — Vercel will wrap it as a Serverless Function
module.exports = app;

