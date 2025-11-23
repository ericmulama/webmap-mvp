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

```bash
git clone https://github.com/<your-username>/kenya-gis-webmap-mvp.git
cd kenya-gis-webmap-mvp
Install dependencies:

bash
Copy code
npm install
Create a .env file:

ini
Copy code
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

sql
Copy code
CREATE INDEX idx_health_geom ON healthcare USING GIST (geom);
Repeat for all tables.

▶️ Running the Server
Start the backend:

bash
Copy code
node server.js
If successful, you’ll see:

nginx
Copy code
Server listening on http://localhost:3000
Connected to Postgres
Visit the map in your browser:

arduino
Copy code
http://localhost:3000
🌍 API Endpoints
Full GeoJSON
bash
Copy code
GET /api/county
GET /api/healthcare
GET /api/schools
GET /api/universities
GET /api/power
BBOX Endpoints
For fast point loading:

bash
Copy code
GET /api/healthcare/bbox?xmin=&ymin=&xmax=&ymax=
GET /api/schools/bbox?xmin=&ymin=&xmax=&ymax=
GET /api/universities/bbox?xmin=&ymin=&xmax=&ymax=
GET /api/power/bbox?xmin=&ymin=&xmax=&ymax=
Example:

bash
Copy code
/api/healthcare/bbox?xmin=36.5&ymin=-1.5&xmax=37&ymax=-1.1
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

