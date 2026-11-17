// Copies the worker of maplibre-gl in public/ so that the package is served even in static

const fs = require("fs");
const path = require("path");

const pkgDir = path.dirname(require.resolve("maplibre-gl/package.json"));
const source = path.join(pkgDir, "dist", "maplibre-gl-worker.mjs");
const target = path.join(__dirname, "..", "public", "maplibre-gl-worker.js");

fs.copyFileSync(source, target);
console.log(`maplibre-gl worker copié → ${path.relative(process.cwd(), target)}`);
