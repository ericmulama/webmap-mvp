# Kenya GIS Webmap MVP

A lightweight, modern web GIS application for visualizing geospatial datasets in Kenya.  
Built with **Node.js + Express**, **Leaflet**, and **PostgreSQL/PostGIS**, the system streams GeoJSON directly from the database and supports dynamic BBOX queries for fast map rendering.

---

## 🚀 Features

### **Frontend (Leaflet)**
- OpenStreetMap basemap
- Multiple thematic infrastructure layers:
  - Healthcare facilities
  - Schools
  - Universities
  - Power stations
- Polygon boundary layer (Counties)
- Automatic BBOX loading for point datasets
- Layer control panel
- Dynamic legend with per-layer colors
- Auto-fit map to loaded boundary features

### **Backend (Node.js + Express)**
- Clean REST API for all layers
- BBOX endpoints for fast spatial filtering
- PostGIS-powered spatial queries
- Optimized GeoJSON response pipeline
- Centralized database connection pool

### **Database (PostgreSQL + PostGIS)**
- Each infrastructure dataset stored as a table with a `geometry` column (EPSG:4326)
- Spatial indexing enabled for fast queries

---

## 🗂️ Project Structure

webmap-mvp/
│
├── public/
│ ├── index.html
│ ├── main.js
│ ├── style.css
│ └── leaflet/ # Leaflet JS + CSS files
│
├── server.js
├── .env
├── package.json
└── README.md

yaml
Copy code

---

## 🔧 Requirements

Before running the project, ensure the following are installed:

| Component | Version |
|----------|---------|
| Node.js  | ≥ 18.x |
| PostgreSQL | ≥ 14.x |
| PostGIS | Enabled extension |
| A browser | Any modern browser |

---

## 📦 Installation

Clone the repository:
git clone https://github.com/ericmulama/kenya-gis-webmap-mvp.git
cd kenya-gis-webmap-mvp

Install dependencies:
Copy code
npm install

Create a .env file:
Insert the below code and replace the password with the password of your postgresql server.
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=yourpassword
PGDATABASE=gisdata
PGPORT=5432
PORT=3000

Place your dataset tables in PostgreSQL with:

id (optional)

geom geometry column (EPSG:4326)

Required attribute columns

Create spatial indexes:
Add the below code for each spatial table to create spatial index.
eg. CREATE INDEX idx_health_geom ON healthcare USING GIST (geom);
NB: Repeat for all tables.

▶️ Running the Server
To start the backend:

Copy code
node server.js
If successful, you’ll see:

Server listening on http://localhost:3000
Connected to Postgres

Visit the map in your browser:
follow the path below to visit your webmap in the browser.
http://localhost:3000

⚙️ How It Works (Technical Overview)
Frontend
Loads counties once (full GeoJSON)

For point layers:

Only loads features inside the map's bounding box

Updates automatically when dragging or zooming

Popups display all attribute fields

Legend updates based on layer definitions

Backend
Uses a PostgreSQL connection pool

Queries PostGIS directly:

ST_AsGeoJSON for output

ST_Intersects for BBOX filtering

Ensures fast rendering even with large datasets

Database
All layers stored in EPSG:4326 for Leaflet compatibility

Spatial indexing ensures high performance

📚 License
MIT License — free to use, modify, and distribute.

