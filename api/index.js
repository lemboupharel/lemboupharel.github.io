const express = require("express");
const path = require("path");

const app = express();

// serve static assets from /public
app.use(express.static(path.join(__dirname, "..", "public")));

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

// optional API endpoint example
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from pharel portfolio!" });
});

// Export the Express app — Vercel will wrap it as a Serverless Function
module.exports = app;
