# Berger Karbar

Web app for Berger paint dealers to run their shop: purchases from Berger, sales to customers, stock across warehouses, payments, expenses and reports.

Built with **Angular 18** (standalone components) and **Angular Material**.

---

## Getting started

**Requirements:** Node.js 18+ and npm.

```bash
npm install
npm start          # ng serve → http://localhost:4200
```

| Command | What it does |
|---|---|
| `npm start` | Dev server with live reload |
| `npm run build` | Production build to `dist/berger-karbar/` |
| `npm run watch` | Development build that rebuilds on change |
| `npm test` | Unit tests (Karma + Jasmine) |

---

## API / environments

All requests go through `HttpHelper` ([httpHelper.ts](src/app/Common/Helper/httpHelper.ts)), which prefixes `BASE_URL` from the environment file:

| File | Used by | `BASE_URL` |
|---|---|---|
| [environment.ts](src/environments/environment.ts) | `ng serve` / dev build | `https://karbardev.bergerbd.com/api/` |
| [environment.prod.ts](src/environments/environment.prod.ts) | `ng build` (production) | `https://karbar.bergertechbd.com/api/` |

For a local API, switch `BASE_URL` in `environment.ts` to the commented `https://localhost:7218/api/` line.

---

## Features

| Area | Route | Page |
|---|---|---|
| Dashboard | `/dashboard` | `Pages/dashboard` |
| Order (to Berger) | `/order` | `Pages/order` |
| Purchase / receive | `/purchase`, `/purchase-details` | `Pages/purchase`, `Pages/purchase-details` |
| Sales | `/salesOrder` | `Pages/sales-order` |
| Stock management | `/stock-management` | `Pages/stock` |
| Items | `/item` | `Pages/item` |
| **Assign items to dealers** | `/assign-item` | `Pages/assign-item` (see [docs/assign-item.md](docs/assign-item.md)) |
| Payments (customer & supplier) | `/payment` | `Pages/payment` |
| Expenses | `/expenseInformation` | `Pages/expense-information` |
| Customers / Suppliers | `/customer`, `/supplier` | `Pages/customer`, `Pages/supplier` |
| Users & settings | `/users`, `/settings` | `Pages/users`, `Pages/settings` |
| Reports | `/stock-report`, `/sales-report`, `/purchase-report`, `/profit-loss-report`, … | `Pages/Reports/*` |

Routes are lazy-loaded in [app.routes.ts](src/app/app.routes.ts). The sidebar menu is in [home-layout.component.ts](src/app/Common/Layout/home-layout/home-layout.component.ts). Dealer users (role 4) get a reduced menu.

---

## Project structure

```
src/app/
├── Pages/              One folder per screen (component + html + scss)
│   └── Reports/        Report screens
├── Services/           API services, one per area (item, payment, purchase, …)
├── Model/              Data models; DTO/ (requests) and VM/ (responses)
└── Common/
    ├── Auth/           AuthGuard, PermissionGuard
    ├── Component/      Shared UI: confirmation dialog, typeable dropdown, …
    ├── Helper/         HttpHelper (API calls), MessageHelperService (toasts)
    ├── Interceptors/   HTTP and timeout interceptors
    ├── Layout/         Login layout and the main layout with the sidebar
    ├── Service/        DataService (builds query strings), local storage
    └── Utils/          Excel export and other helpers
```

### Conventions

- **API calls:** add a method to the area's service in `Services/` and call `this.http.get/post(...)` with the path relative to `BASE_URL`.
- **List filters:** pass a `SearchRequest` ([searchRequest.ts](src/app/Model/DTO/searchRequest.ts)); `DataService.getSearchModel()` turns it into the query string.
- **Responses:** APIs return `ApiResponse` (`isSuccess`, `result`, `totalCount`, `statusCode`, `errorMessage`). Show messages with `MessageHelperService.showMessage()`.
- **Tables:** wrap them in `.table__body` so every page uses the same scroll height (see [styles.scss](src/styles.scss)).
- **New page:** create it under `Pages/`, add a lazy route in `app.routes.ts` and a menu entry in `home-layout.component.ts`.

---

## User manual

English and Bangla manuals are written as HTML in [docs/user-manual/](docs/user-manual/). To rebuild the PDFs that the Dashboard links to (Git Bash, needs Edge or Chrome):

```bash
bash docs/user-manual/build.sh
```

The output goes to `src/assets/manual/`.

---

## Repository

- GitHub: [Tonny-Saha/Berger-Karbar](https://github.com/Tonny-Saha/Berger-Karbar)
- Main branch: `main`
