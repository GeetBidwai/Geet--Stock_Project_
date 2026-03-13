# TradeVista

TradeVista is a React + Vite financial analytics frontend connected to a Django REST backend. The project focuses on portfolio tracking, market analytics, machine-learning style insights, metals comparison, Bitcoin forecasting, and side-by-side stock comparison in a clean dashboard UI.

This codebase was refactored to improve UI/UX, layout consistency, chart readability, and page structure while keeping the existing backend API integrations and authentication flow intact.

## Highlights

- Modern dashboard-style frontend built with React and Vite
- Django REST backend integration preserved
- Protected analytics pages with existing auth flow
- Portfolio builder and tracked holdings table
- Growth analytics with future projection view
- ML analysis with clustering, regression, and forecast visuals
- Gold/Silver analytics with indexed trend comparison
- Bitcoin analytics with historical + forecast charts
- Compare page for side-by-side position analysis
- Responsive layouts for desktop, tablet, and mobile

## Tech Stack

- React 19
- Vite
- React Router
- Recharts
- Axios
- Django REST API backend

## Application Routes

Public:

- `/` - Home / landing page
- `/login` - Login
- `/signup` - Signup

Protected:

- `/dashboard` - Main portfolio dashboard
- `/growth` - Portfolio growth analytics
- `/ml-analysis` - ML analysis workspace
- `/gold-silver` - Precious metals analytics
- `/bitcoin` - Bitcoin forecast analytics
- `/compare` - Compare tracked positions
- `/stock/:stockId` - Stock details (global stock id route)
- `/portfolio/:portfolioId` - Portfolio detail view
- `/portfolio/:portfolioId/stock/:stockId` - Portfolio-scoped stock details

Legacy redirects kept for compatibility:

- `/features` -> `/ml-analysis`
- `/metals` -> `/gold-silver`
- `/crypto` -> `/bitcoin`

## Backend API (Current)

Auth:

- `POST /api/auth/signup/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`

Portfolios:

- `GET /api/portfolios/` - List current user's portfolios
- `POST /api/portfolios/` - Create portfolio
- `GET /api/portfolios/{id}/` - Portfolio detail with stocks + summary
- `DELETE /api/portfolios/{id}/` - Delete portfolio

Stocks:

- `GET /api/stocks/search/?q=...` - Search suggestions
- `GET /api/stocks/` - List all stocks for current user
- `POST /api/stocks/` - Add stock using payload with `portfolio`, `symbol`, `name`, `sector`
- `GET /api/stocks/{id}/` - **Stock detail endpoint** (returns chart + cards; supports `range`)
- `DELETE /api/stocks/{id}/` - Delete stock
- `GET /api/stocks/{id}/history/` - Legacy/compat detail endpoint (also supports `range`)
- `GET /api/portfolios/{portfolio_id}/stocks/` - List stocks in a portfolio
- `POST /api/portfolios/{portfolio_id}/stocks/` - Add stock to portfolio
- `GET /api/portfolios/{portfolio_id}/stocks/{stock_id}/` - Portfolio-scoped stock detail
- `DELETE /api/portfolios/{portfolio_id}/stocks/{stock_id}/` - Remove stock from portfolio

Portfolio analytics:

- `GET /api/portfolios/{id}/top-discount/`
- `GET /api/portfolios/{id}/top-growth/?range=1w|1mo|3mo|6mo|1y|3y`
- `GET /api/portfolios/{id}/risk-clusters/`
- `GET /api/dashboard/summary/`

Other analytics:

- `GET /api/metals/history/?range=1mo|3mo|6mo|1y|3y`
- `GET /api/crypto/btc/forecast/?model=linear|arima|rnn&days=14|30|60|90`

## Key UI Work Completed

- Reworked the home page into a proper landing page with:
  - TradeVista hero section
  - Market Pulse panel
  - Market Overview
  - Market Signals
  - selected stock chart with time-range controls
- Updated login flow so authenticated users land on the home experience
- Refined navbar spacing, sticky behavior, and protected navigation structure
- Rebuilt dashboard cards, analytics layout, chart spacing, and table containment
- Fixed overflowing tables and card padding across dashboard, growth, ML analysis, and Bitcoin pages
- Improved chart readability by standardizing:
  - axis styles
  - grid treatment
  - tooltip formatting
  - chart containment inside cards

## Analytics Pages

### Dashboard

- Portfolio builder with country, sector, stock, and quantity selection
- Portfolio table with tracked holdings and derived metrics
- Analytics cards for:
  - Price Change
  - Discount Percentage
  - Opportunity Value
  - P/E Ratio

### Growth

- Portfolio growth chart with actual vs predicted value
- Summary stat cards in a single clean section
- Sector allocation pie chart with controlled labels and legend spacing

### ML Analysis

- KNN clustering scatter chart
- Linear regression bar chart
- ARIMA-style forward trajectory chart
- Analysis table with clean card containment and row selection

### Gold / Silver

- Gold price chart
- Silver price chart
- Indexed trend comparison

### Bitcoin

- Bitcoin historical price chart with forecast overlay
- Forecast-only trend visualization
- Summary cards for model, forecast days, expected return, and trend

### Compare

- Side-by-side comparison of tracked positions
- Price comparison
- Trend comparison
- P/E ratio comparison

## Rebased Metals Comparison

The Gold/Silver trend comparison uses rebasing so both assets can be compared fairly on the same chart.

Problem:

- Gold and silver trade at very different absolute price levels
- Plotting both raw prices on one Y-axis makes silver appear flat or insignificant

Solution:

- Both series are rebased to `100` at the starting date
- Each later point is expressed relative to its own starting value

Formula:

```text
indexed_value = (current_price / first_price) * 100
```

Example:

- If gold moves from `1900` to `2280`, its indexed value becomes `120`
- If silver moves from `24` to `36`, its indexed value becomes `150`

Meaning:

- Gold is up `20%`
- Silver is up `50%`

This makes the comparison chart show relative performance instead of raw price size.

## Project Structure

```text
stock/
├─ config/                  # Django backend project
├─ frontend/                # React + Vite frontend
│  ├─ src/
│  │  ├─ charts/
│  │  ├─ components/
│  │  ├─ context/
│  │  ├─ pages/
│  │  ├─ services/
│  │  ├─ App.jsx
│  │  ├─ dashboard.css
│  │  └─ index.css
├─ start-dev.ps1            # Starts frontend + backend together
└─ README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Python and the Django backend environment in `config/venv`

### Frontend Setup

From the project root:

```powershell
cd frontend
npm install
```

### Run Frontend Only

```powershell
cd frontend
npm run dev
```

### Run Django Backend Only

```powershell
cd frontend
npm run dev:backend
```

### Run Full Local Stack

```powershell
cd frontend
npm run dev:stack
```

## Available Frontend Scripts

```powershell
npm run dev
npm run dev:backend
npm run dev:stack
npm run build
npm run lint
npm run preview
```

## Build and Quality Check

```powershell
cd frontend
npm run lint
npm run build
```

## Important Notes

- Existing backend APIs were preserved during the UI refactor
- Existing authentication logic was preserved
- Axios services were kept in place
- Some displayed analytics are derived from available market data when backend fields are missing
- True portfolio profit/loss requires real trade-entry prices; without stored entry prices, market-based comparison metrics are used instead

## Status

The frontend is in a strong demo-ready state with a significantly improved dashboard experience, cleaner information hierarchy, responsive layouts, and much more readable analytics visualizations.
