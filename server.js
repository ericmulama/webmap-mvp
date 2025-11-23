// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Postgres pool using .env
const pool = new Pool({
  user: process.env.PGUSER || process.env.DB_USER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || process.env.DB_NAME || 'kenya_data',
  password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
  port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
  max: 20,
  idleTimeoutMillis: 30000,
});

// test DB connection once on start
pool.query('SELECT 1')
  .then(() => console.log('Connected to Postgres'))
  .catch(err => console.error('Postgres connection error', err.message));

// canonical layer keys -> exact table names in Postgres
const LAYERS = {
  county:      { table: 'public."County"', geom: 'geom' },
  healthcare:  { table: 'public."Healthcare_Facilities"', geom: 'geom' },
  power:       { table: 'public."Power_Stations_4326"', geom: 'geom' },
  schools:     { table: 'public."Schools_4326"', geom: 'geom' },
  universities:{ table: 'public."ken_un"', geom: 'geom' }
};

// safe helper for full-layer GeoJSON (use for small polygons like counties)
async function fullLayerGeoJSON(table, geom) {
  const sql = `
    SELECT json_build_object(
      'type','FeatureCollection',
      'features', COALESCE(json_agg(feature),'[]'::json)
    ) AS fc
    FROM (
      SELECT json_build_object(
        'type','Feature',
        'geometry', ST_AsGeoJSON(${geom})::json,
        'properties', to_jsonb(t) - '${geom}'
      ) AS feature
      FROM ${table} t
    ) s;
  `;
  const { rows } = await pool.query(sql);
  return rows[0].fc;
}

// bbox GeoJSON using indexable && filter + ST_Intersects to avoid false positives
async function bboxLayerGeoJSON(table, geom, xmin, ymin, xmax, ymax, limit = 10000) {
  const sql = `
    SELECT json_build_object(
      'type','FeatureCollection',
      'features', COALESCE(json_agg(feature),'[]'::json)
    ) AS fc
    FROM (
      SELECT json_build_object(
        'type','Feature',
        'geometry', ST_AsGeoJSON(${geom})::json,
        'properties', to_jsonb(t) - '${geom}'
      ) AS feature
      FROM ${table} t
      WHERE t.${geom} && ST_MakeEnvelope($1, $2, $3, $4, 4326)
        AND ST_Intersects(t.${geom}, ST_MakeEnvelope($1, $2, $3, $4, 4326))
      LIMIT $5
    ) s;
  `;
  const { rows } = await pool.query(sql, [xmin, ymin, xmax, ymax, limit]);
  return rows[0].fc;
}

// List layers
app.get('/api/layers', (req, res) => {
  res.json(Object.keys(LAYERS));
});

// Full layer route: /api/:layer
app.get('/api/:layer', async (req, res) => {
  try {
    const key = req.params.layer;
    if (!LAYERS[key]) return res.status(404).json({ error: 'Layer not found' });
    const { table, geom } = LAYERS[key];

    // serve counties full (polygons) or full if explicitly requested
    const fc = await fullLayerGeoJSON(table, geom);
    return res.json(fc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// BBOX route: /api/:layer/bbox?xmin=...&ymin=...&xmax=...&ymax=...&limit=...
app.get('/api/:layer/bbox', async (req, res) => {
  try {
    const key = req.params.layer;
    if (!LAYERS[key]) return res.status(404).json({ error: 'Layer not found' });

    const xmin = parseFloat(req.query.xmin);
    const ymin = parseFloat(req.query.ymin);
    const xmax = parseFloat(req.query.xmax);
    const ymax = parseFloat(req.query.ymax);
    const limit = Math.min(50000, parseInt(req.query.limit || '10000', 10));

    if ([xmin, ymin, xmax, ymax].some(v => Number.isNaN(v))) {
      return res.status(400).json({ error: 'Invalid bbox parameters' });
    }

    const { table, geom } = LAYERS[key];
    const fc = await bboxLayerGeoJSON(table, geom, xmin, ymin, xmax, ymax, limit);
    return res.json(fc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// health check
app.get('/health', (req, res) => res.json({ ok: true }));

// fallback serve index
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
