# Assign Item (Assign products)

Lets an admin choose which Berger items each dealer (tenant) can use, in which warehouses, and whether each item is Active or Inactive for them.

- **Route:** `/assign-item`
- **Sidebar:** "Assign Item" (default/admin menu only; not in the role 4 dealer menu)
- **Status:** frontend done; **backend endpoints below still need to be built**

---

## How the page works

1. **Dealer name (multiple).** Pick one or more dealers. The logged-in dealer is selected by default.
2. **Warehouse (multiple).** Lists only the warehouses linked to the selected dealers. All of them are selected by default.
3. **Material group (multiple).** Pick one or more groups (Emulsion, Primer, …). **Choosing a group ticks only the items of that group.** Removing the group unticks them again. Items can still be ticked or unticked one by one.
4. **Status / Search.** Filters the item table only. They do not change what is selected.
5. **Action buttons** apply to the selected items, for all selected dealers and warehouses:
   - **Assign:** assigns the items (as Active)
   - **Set Active / Set Inactive:** changes the status of the selected items
   - **Row switch:** changes the status of one item

The selection bar shows the result, for example *"128 items selected · 2 groups · 3 dealers · 2 warehouses"*.

### How group selection works

When a group is chosen, the page loads **all** items of that group (every page, 1,000 at a time) and ticks them. It also checks each item's `categoryId` on the client, so only items of that group are ticked. The actions always send the exact ticked `itemIds`.

---

## Existing APIs used (no change)

| Purpose | Call |
|---|---|
| Dealers | `GET Tenant` (`ReportService.fetchAllDealer`) |
| Warehouses of a dealer | `GET Warehouse?TenantId={dealerId}` (called once per selected dealer) |
| Material groups | `GET Category?TenantId=…` (categories are used as material groups) |

---

## Backend work needed

### 1. Item list: accept several groups and warehouses

`GET Item` currently accepts a single `CategoryId`. The page sends **repeated** query parameters:

```
GET Item?PageIndex=1&PageSize=10&TenantId=5&IsBergerItem=true&status=1&SearchText=base
        &CategoryIds=3&CategoryIds=7
        &WarehouseIds=12&WarehouseIds=14
```

- `CategoryIds`: filter by any of these material groups (empty = all)
- `WarehouseIds`: filter by any of these warehouses (empty = all)
- The response must include `totalCount`. The page also uses it with `PageSize=1` to count all items in the chosen groups.

### 2. `POST ItemAssign`: assign items **and** set Active / Inactive

One API and one model for all three actions:

```json
{
  "tenantIds": [5, 9, 11],
  "items": [
    {
      "itemId": 1001,
      "itemName": "W/C Smooth Classic Base W1 3.60 L",
      "brandName": "Berger",
      "categoryName": "Back Coat",
      "status": 1
    }
  ]
}
```

| Action | `items` | `status` |
|---|---|---|
| **Assign** | all ticked items | `1` |
| **Set Active / Set Inactive** | all ticked items | `1` / `0` |
| **Row switch** | that one item | `1` / `0` |

Create or update one assignment per **dealer × item**. `status`: `1` = Active, `0` = Inactive (`RecordStatus`).

### 3. (removed)

`ItemAssign/status` is no longer used; status changes go through `POST ItemAssign`.

### 4. `POST ItemAssign/bulk-upload`: Excel upload

`multipart/form-data`, file field name **`File`**. Return the usual `ApiResponse`; `result` is shown to the user as the message.

The **Template** button downloads `assign-item-template.xlsx` with these columns:

| Dealer Code | Warehouse Code | Material Number | Status (Active/Inactive) |
|---|---|---|---|

### 5. (Optional) `GET ItemAssign`: assignment rows

Already in the service as `fetchAssignedItems`, but not used yet. The table currently reads `status` from the plain `Item` list. To show the real status per dealer and warehouse, return assignment rows here and switch `getAllItems()` to use it.

All responses use the standard `ApiResponse` shape (`isSuccess`, `result`, `totalCount`, `statusCode`, `errorMessage`).

---

## Frontend files

| File | Purpose |
|---|---|
| [assign-item.component.ts](../src/app/Pages/assign-item/assign-item.component.ts) | Page logic, selection modes, payload building |
| [assign-item.component.html](../src/app/Pages/assign-item/assign-item.component.html) | Layout |
| [assign-item.component.scss](../src/app/Pages/assign-item/assign-item.component.scss) | Styles (custom status switch, chips) |
| [item-assign.service.ts](../src/app/Services/item-assign.service.ts) | API calls listed above |
| [app.routes.ts](../src/app/app.routes.ts) | `assign-item` route |
| [home-layout.component.ts](../src/app/Common/Layout/home-layout/home-layout.component.ts) | Sidebar menu entry |

---

## Open questions

- **Material group = Category?** The page uses categories as material groups. If Berger material groups are a separate list, we need an endpoint for them.
- **Dealer menu:** should dealers (role 4) see this page?
- **Warehouse column:** it was removed from the table. Bring it back once `GET ItemAssign` returns per-warehouse rows?
