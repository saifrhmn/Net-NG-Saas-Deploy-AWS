# GetItemStockReport — Updated Stored Procedure

## Changes
- `StockValue` = `Quantity * PurchasePrice`.
- `WeightAvgStockValue` = `Quantity * WeightedAveragePrice` (fallback `PurchasePrice` when 0).
- Warehouse total `WarehouseTotalWeightAvgValue`, grand total `TotalWeightAvgStockValue`.
- `WeightedAvgPrice` column returns the effective value.
- All money columns `CAST(... AS DECIMAL(18,2))` to avoid double→decimal cast errors.
- Removed `TenantName` and `TotalPurchaseValue` from output.

```sql
ALTER   PROCEDURE [dbo].[GetItemStockReport]
    @TenantId      INT           = NULL,
    @ItemId        INT           = NULL,
    @BrandId       INT           = NULL,
    @CategoryId    INT           = NULL,
    @WarehouseId   INT           = NULL,
    @MaterialNo    NVARCHAR(MAX) = NULL,
    @ItemName      NVARCHAR(MAX) = NULL,
    @FromDate      DATETIME      = NULL,
    @ToDate        DATETIME      = NULL,
    @PageIndex     INT           = NULL,
    @PageSize      INT           = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset BIGINT =
        CASE WHEN @PageIndex IS NOT NULL AND @PageSize IS NOT NULL
             THEN (CAST(@PageIndex AS BIGINT) - 1) * @PageSize
             ELSE 0 END;

    DECLARE @Fetch BIGINT =
        CASE WHEN @PageIndex IS NOT NULL AND @PageSize IS NOT NULL
             THEN @PageSize
             ELSE 1000000 END;

    ;WITH StockAgg AS
    (
        SELECT
            ItemId,
            WarehouseId,
            TenantId,
            CAST(SUM(ISNULL(Quantity, 0)) AS DECIMAL(18,2)) AS Quantity,
            MAX(COALESCE(UpdatedDate, CreatedDate)) AS StockDate
        FROM Stocks
        GROUP BY ItemId, WarehouseId, TenantId
    ),
    BaseData AS
    (
        SELECT
            i.Id                       AS ItemId,
            s.WarehouseId,
            i.MaterialNumber,
            i.Name                     AS ItemName,
            b.Name                     AS Brand,
            c.Name                     AS Catagory,
            w.Name                     AS Warehouse,
            u.Name                     AS Unit,
            i.MRP,
            i.SellingPrice,
            CAST(ISNULL(i.PurchasePrice, 0) AS DECIMAL(18,2)) AS PurchasePrice,
            CAST(
                CASE WHEN ISNULL(i.WeightedAveragePrice, 0) = 0
                     THEN ISNULL(i.PurchasePrice, 0)
                     ELSE i.WeightedAveragePrice
                END AS DECIMAL(18,2))                         AS EffectiveWeightedAvgPrice,
            s.Quantity,
            CAST(s.Quantity * ISNULL(i.PurchasePrice, 0) AS DECIMAL(18,2)) AS StockValue,
            CAST(s.Quantity *
                 CASE WHEN ISNULL(i.WeightedAveragePrice, 0) = 0
                      THEN ISNULL(i.PurchasePrice, 0)
                      ELSE i.WeightedAveragePrice
                 END AS DECIMAL(18,2))                        AS WeightAvgStockValue,
            s.StockDate,
            te.Id                      AS TenantId,
            te.TenantCustomerNo
        FROM Items i
        INNER JOIN StockAgg s
            ON s.ItemId = i.Id
        LEFT JOIN Warehouses w ON w.Id = s.WarehouseId
        LEFT JOIN Uoms       u ON u.Id = i.UomId
        LEFT JOIN Brands     b ON b.Id = i.BrandId
        LEFT JOIN Categories c ON c.Id = i.CategoryId
        LEFT JOIN Tenants    te ON te.Id = i.TenantId
        WHERE
            (@TenantId    IS NULL OR i.TenantId   = @TenantId)
        AND (@ItemId      IS NULL OR i.Id          = @ItemId)
        AND (@BrandId     IS NULL OR i.BrandId     = @BrandId)
        AND (@CategoryId  IS NULL OR i.CategoryId  = @CategoryId)
        AND (@WarehouseId IS NULL OR s.WarehouseId = @WarehouseId)
        AND s.Quantity <> 0
        AND (@FromDate IS NULL OR s.StockDate >= @FromDate)
        AND (@ToDate   IS NULL OR s.StockDate <  DATEADD(DAY, 1, @ToDate))
        AND
        (
            @MaterialNo IS NULL
            OR i.MaterialNumber LIKE '%' + @MaterialNo + '%'
            OR i.Name           LIKE '%' + @MaterialNo + '%'
        )
        AND
        (
            @ItemName IS NULL
            OR i.Name LIKE '%' + @ItemName + '%'
        )
    ),
    WarehouseAgg AS
    (
        SELECT
            WarehouseId,
            CAST(SUM(Quantity) AS DECIMAL(18,2))            AS WarehouseTotalQuantity,
            CAST(SUM(StockValue) AS DECIMAL(18,2))          AS WarehouseTotalValue,
            CAST(SUM(WeightAvgStockValue) AS DECIMAL(18,2)) AS WarehouseTotalWeightAvgValue
        FROM BaseData
        GROUP BY WarehouseId
    ),
    GrandTotal AS
    (
        SELECT
            CAST(SUM(WarehouseTotalValue)          AS DECIMAL(18,2)) AS TotalStockValue,
            CAST(SUM(WarehouseTotalQuantity)       AS DECIMAL(18,2)) AS TotalStockQuantity,
            CAST(SUM(WarehouseTotalWeightAvgValue) AS DECIMAL(18,2)) AS TotalWeightAvgStockValue
        FROM WarehouseAgg
    ),
    RowCountCte AS
    (
        SELECT COUNT(1) AS TotalCount FROM BaseData
    )

    SELECT
        d.MaterialNumber,
        d.ItemName,
        d.Brand,
        d.Catagory,
        d.Warehouse,

        d.Quantity,

        wa.WarehouseTotalQuantity,
        wa.WarehouseTotalValue,
        wa.WarehouseTotalWeightAvgValue,

        d.Unit,
        d.MRP,
        d.SellingPrice,
        d.PurchasePrice,

        d.EffectiveWeightedAvgPrice AS WeightedAvgPrice,

        d.StockValue,                       -- Quantity * PurchasePrice
        d.WeightAvgStockValue,              -- Quantity * WeightedAveragePrice (fallback PurchasePrice)

        gt.TotalStockValue,
        gt.TotalStockQuantity,
        gt.TotalWeightAvgStockValue,

        d.StockDate,

        d.TenantId,
        d.TenantCustomerNo,

        rc.TotalCount
    FROM BaseData d
    INNER JOIN WarehouseAgg wa ON wa.WarehouseId = d.WarehouseId
    CROSS JOIN GrandTotal    gt
    CROSS JOIN RowCountCte   rc
    ORDER BY d.StockDate DESC, d.WarehouseId DESC
    OFFSET     @Offset ROWS
    FETCH NEXT @Fetch  ROWS ONLY;
END
GO
```
