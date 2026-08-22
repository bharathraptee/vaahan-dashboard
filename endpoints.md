# Vahan API & Dashboard Endpoints Reference Guide

This document details all API endpoints used by the Vahan Analytics Competitor Dashboard, both at the **FastAPI Proxy Server Layer (`main.py`)** and the **Upstream Vahan Government Portal (`analytics.parivahan.gov.in`)**.

---

## 1. FastAPI Proxy Backend Routes (`main.py`)

The FastAPI proxy server interfaces with Vahan's servers, handles pagination bugs, sequences requests with human-like delays (`time.sleep`) to prevent rate-limiting (HTTP 429), and aggregates data for the React frontend.

### `GET /api/companies`
- **Purpose**: Fetches the complete master list of vehicle manufacturers/makers across India (~5,700+ companies).
- **Upstream Target**: `https://analytics.parivahan.gov.in/analytics/json_makers`
- **Details**: Performs paginated fetching using `size=100` (chunk size) to bypass Vahan's server pagination bug where requesting `size=2000` causes companies starting with letters A–G to be skipped.

### `GET /api/rtos/{state_code}`
- **Purpose**: Fetches the list of all RTO offices (names and codes) for a specified Indian state code (e.g. `TN`, `KA`, `MH`).
- **Upstream Target**: `https://analytics.parivahan.gov.in/analytics/json_rtos?stateCode={stateCode}`
- **Details**: Returns JSON array of RTO objects `{ rtoCode, rtoName }`. Used to populate city dropdowns, RTO filters, and Multi-City comparison selectors.

### `POST /api/data/compare`
- **Purpose**: Aggregates multi-endpoint competitor comparison metrics for selected brands.
- **Upstream Target**: Multiple Vahan analytics endpoints (listed in Section 2).
- **Details**: Accepts filter payload (selected companies, time filter, year bounds, state, RTO, fuel type, vehicle category) and queries 7 core Vahan endpoints with request pacing to prevent rate limits.

### `POST /api/data/city-rto-breakdown`
- **Purpose**: Fetches high-precision month-wise registration data for specific RTOs inside selected cities.
- **Upstream Target**: `https://analytics.parivahan.gov.in/analytics/publicdashboard/vahandashboard/durationWiseRegistrationTable`
- **Details**: Sequentially iterates through selected RTOs and companies with `time.sleep(0.3)` request delays to ensure 100% data accuracy without triggering Vahan IP blocks or missing values.

---

## 2. Upstream Vahan Government Endpoints

Base URL: `https://analytics.parivahan.gov.in/analytics/publicdashboard`

### 1. Dashboard Count Endpoint
- **URL**: `/vahan/registration/dashboardcount`
- **Purpose**: Retrieves high-level total vehicle transaction volume (`totalTransactions`) and total revenue collected for a specific manufacturer.
- **Used In**: Top KPI Metric Stat Cards.

### 2. Yearly Trend Endpoint
- **URL**: `/vahandashboard/vahanyearwiseregistrationtrend`
- **Purpose**: Returns historical year-by-year vehicle registration counts for selected manufacturers across multiple years.
- **Used In**: Full-width **Yearly Trend** line chart.

### 3. Month-Wise Duration Table Endpoint
- **URL**: `/vahandashboard/durationWiseRegistrationTable`
- **Purpose**: Retrieves detailed month-by-month vehicle registration counts for a specific calendar or fiscal year (requires `calendarType=3`, `timePeriod=2`).
- **Used In**: 
  - **Detailed Data Segregation (Duration Wise)** table.
  - **City RTO Breakdown** table.
  - **Multi-City RTO Comparison** section.

### 4. Top 5 Territories (State/RTO) Endpoint
- **URL**: `/vahandashboard/top5chart`
- **Purpose**: 
  - When `stateCode` is empty: Returns the **Top 5 States** with highest registration volume for a manufacturer.
  - When `stateCode` is specified (e.g. `KA`): Returns the **Top 5 RTOs** within that state.
- **Used In**: **Top 5 Territories (Per Brand)** cards and independent per-brand state-to-RTO drill-down.

### 5. Fuel Distribution Endpoint
- **URL**: `/vahandashboard/fueltypedonutchart`
- **Purpose**: Returns vehicle registration breakdown categorized by fuel type (`ELECTRIC(BOV)`, `PURE EV`, `PETROL`, `DIESEL`, etc.).
- **Used In**: **Fuel** distribution chart.

### 6. Vehicle Class Distribution Endpoint
- **URL**: `/vahandashboard/classdistribution`
- **Purpose**: Returns vehicle registration breakdown categorized by vehicle class (`Motor Cycle/Scooter`, `Moped`, `Goods Carrier`, `Adapted Vehicle`, etc.).
- **Used In**: **Class** distribution chart.

### 7. Registration Status Distribution Endpoint
- **URL**: `/vahandashboard/statusdistribution`
- **Purpose**: Returns vehicle registration counts by compliance/registration status (`ACTIVE_COMPLIANT`, `ACTIVE_NON_COMPLIANT`, etc.).
- **Used In**: **Status** distribution chart.

### 8. Master Makers List Endpoint
- **URL**: `https://analytics.parivahan.gov.in/analytics/json_makers`
- **Query Params**: `page`, `size`
- **Purpose**: Returns paginated list of vehicle manufacturers registered on Vahan.

### 9. Master RTOs List Endpoint
- **URL**: `https://analytics.parivahan.gov.in/analytics/json_rtos`
- **Query Params**: `stateCode`
- **Purpose**: Returns list of RTO offices registered under a given state.

---

## 3. Query Parameter Reference

All dashboard endpoints construct HTTP GET query parameters matching Vahan's expected parameters:

| Parameter | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `vehicleMakers` / `vehicleMakers[]` | String | `RAPTEE ENERGY PVT LTD` | Selected vehicle manufacturer name |
| `stateCode` | String | `KA`, `TN` | 2-letter state code (`""` for All States) |
| `rtoCode` | Integer | `0`, `4` | RTO office code (`0` for All RTOs) |
| `timeFilter` | String | `As on Date`, `Calendar Year` | Selected time filter mode |
| `fromYear` | Integer | `2000`, `2026` | Start year boundary |
| `toYear` | Integer | `2026` | End year boundary |
| `fuelType` | String | `""`, `ELECTRIC(BOV)` | Fuel type filter |
| `vehicleCategory` | String | `""`, `2WN` | Vehicle category filter |
| `calendarType` | Integer | `3` | Calendar type indicator (3 = Gregorian Calendar) |
| `timePeriod` | Integer | `2` | Time period granularity (2 = Monthly) |