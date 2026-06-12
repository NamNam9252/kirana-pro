# API Reference

This document lists all HTTP endpoints implemented in the project, their request payloads / query parameters, and authorization requirements.

## Auth
- All guarded endpoints require an `Authorization` header with a Bearer JWT: `Authorization: Bearer <token>`.
- The JWT is signed using `process.env.JWT_SECRET`. The token payload shape is:

```json
{
  "id": "<user-uuid>",
  "name": "<user name>",
  "email": "<user email>",
  "role": "SHOPKEEPER|CUSTOMER"
}
```

Role-based access uses the `@Roles(...)` decorator. If a controller has `@Roles(Role.SHOPKEEPER)` then the token's `role` must equal `SHOPKEEPER`.

---

## Public

- GET /
  - Controller: AppController
  - Returns a greeting string
  - No auth

- POST /auth/register
  - Controller: AuthController
  - Body: UserRegisterDto
    - name: string (required)
    - email: string (required, email)
    - role: "SHOPKEEPER" | "CUSTOMER" (required)
    - password: string (required, min 6)
  - Response: created user / token (handled by service)

- POST /auth/login
  - Controller: AuthController
  - Body: UserLoginDto
    - email: string (required)
    - password: string (required)
  - Response: login result (token)

---

## Search (Public)

- GET /search/shops/nearby
  - Query: NearbyShopsQueryDto
    - lat: number (required)
    - lng: number (required)
    - radiusKm?: number (optional)
    - limit?: number (optional)

- GET /search/items
  - Query: ItemSearchQueryDto
    - lat: number (required)
    - lng: number (required)
    - radiusKm?: number
    - q?: string
    - category?: string
    - limit?: number
    - offset?: number

---

## Customer APIs (Guarded: role=Customer)
All endpoints below require `Authorization: Bearer <token>` and `role` must be `CUSTOMER`.

- GET /customer/profile
  - Returns the authenticated customer's profile

- PATCH /customer/profile
  - Body: UpdateCustomerProfileDto (all optional)
    - fullName?: string
    - phone?: string
    - alternatePhone?: string
    - avatarUrl?: string

- POST /customer/addresses
  - Body: CreateCustomerAddressDto
    - label?: string
    - recipientName?: string
    - phone?: string
    - addressLine1: string (required)
    - addressLine2?: string
    - landmark?: string
    - city: string (required)
    - state: string (required)
    - postalCode: string (required)
    - country?: string
    - latitude?: number
    - longitude?: number
    - isDefault?: boolean

- GET /customer/addresses
  - Query: ListCustomerAddressesQueryDto
    - includeInactive?: 'true' | 'false'

- GET /customer/addresses/:addressId
  - Param: addressId (UUID)

- PATCH /customer/addresses/:addressId
  - Body: UpdateCustomerAddressDto (same fields as create, optional)

- DELETE /customer/addresses/:addressId
  - Archives the address

---

## Shopkeeper APIs (Guarded: role=Shopkeeper)
All endpoints below require `Authorization: Bearer <token>` and `role` must be `SHOPKEEPER`.

### Shops

- POST /shopkeeper/shops
  - Body: CreateShopDto
    - name: string (required)
    - description?: string
    - phone?: string
    - email?: string
    - addressLine1: string (required)
    - addressLine2?: string
    - city: string (required)
    - state: string (required)
    - postalCode: string (required)
    - latitude?: number
    - longitude?: number

- GET /shopkeeper/shops
  - Lists shops belonging to authenticated shopkeeper

- PATCH /shopkeeper/shops/:shopId
  - Body: UpdateShopDto (same fields as create, optional)

- DELETE /shopkeeper/shops/:shopId
  - Archive shop

### Shopkeeper Profile

- GET /shopkeeper/profile
- PATCH /shopkeeper/profile
  - Body: UpdateShopkeeperProfileDto
    - phone?: string
    - gstNumber?: string
    - panNumber?: string
    - kycStatus?: enum (see `KycStatus`)
    - kycDocumentUrl?: string

### Customers (per-shop)

- POST /shopkeeper/shops/:shopId/customers
  - Body: CreateCustomerDto
    - name: string (required)
    - phone: string (required)
    - email?: string

- GET /shopkeeper/shops/:shopId/customers
  - Query: ListCustomersQueryDto
    - q?: string
    - includeInactive?: 'true'|'false'

- GET /shopkeeper/shops/:shopId/customers/:customerId

- PATCH /shopkeeper/shops/:shopId/customers/:customerId
  - Body: UpdateCustomerDto (name?, phone?, email?)

- DELETE /shopkeeper/shops/:shopkeeperId/customers/:customerId

### Sales

- POST /shopkeeper/shops/:shopId/sales/bills
  - Body: CreateSalesBillDto
    - paymentMode: enum (see `PaymentMode`)
    - customerName/customerPhone: required if `paymentMode === CREDIT`
    - customerEmail?: string
    - discountAmount?: number
    - taxAmount?: number
    - paidAmount?: number
    - dueDate?: Date
    - notes?: string
    - items: array of CreateSalesBillItemDto (required)
      - inventoryItemId: UUID
      - quantity: integer >=1
      - unitPrice: number

- GET /shopkeeper/shops/:shopId/sales/bills
  - Query: ListSalesBillsQueryDto
    - status?: PaymentStatus
    - paymentMode?: PaymentMode
    - from?: Date
    - to?: Date

- GET /shopkeeper/shops/:shopId/sales/bills/:billId

- POST /shopkeeper/shops/:shopId/sales/bills/:billId/payments
  - Body: CreateSalesPaymentDto
    - amount: number (required)
    - paymentMode?: PaymentMode
    - reference?: string
    - notes?: string

- GET /shopkeeper/shops/:shopId/sales/credit-customers
  - Query: CreditCustomersQueryDto
    - from?: Date
    - to?: Date
    - minOutstanding?: number

### Inventory

- POST /shopkeeper/shops/:shopId/inventory/categories
  - Body: CreateInventoryCategoryDto
    - name: string (required)
    - description?: string

- GET /shopkeeper/shops/:shopId/inventory/categories
- GET /shopkeeper/shops/:shopId/inventory/categories/:categoryId
- PATCH /shopkeeper/shops/:shopId/inventory/categories/:categoryId
  - Body: UpdateInventoryCategoryDto

- DELETE /shopkeeper/shops/:shopId/inventory/categories/:categoryId

- POST /shopkeeper/shops/:shopId/inventory/categories/:categoryId/items
  - Body: CreateInventoryItemDto
    - name: string
    - description?: string
    - categoryId?: UUID
    - sku?: string
    - unit?: string
    - quantity?: int
    - reorderLevel?: int
    - costPrice?: number
    - sellingPrice?: number

- GET /shopkeeper/shops/:shopId/inventory/categories/:categoryId/items

- POST /shopkeeper/shops/:shopId/inventory/transactions
  - Body: CreateInventoryTransactionDto
    - type: enum InventoryTransactionType
    - reference?: string
    - notes?: string
    - items: array of CreateInventoryTransactionItemDto
      - inventoryItemId: UUID
      - quantity: integer >=1
      - unitCost?: number
      - unitPrice?: number

- GET /shopkeeper/shops/:shopId/inventory/transactions
  - Query: ListInventoryTransactionsQueryDto (type?, from?, to?)

- GET /shopkeeper/shops/:shopId/inventory/transactions/:transactionId

- POST /shopkeeper/shops/:shopId/inventory/damage
  - Body: CreateInventoryTransactionPayloadDto
    - reference?: string
    - notes?: string
    - items: array of CreateInventoryTransactionItemDto

- POST /shopkeeper/shops/:shopId/inventory/loss
  - Body: CreateInventoryTransactionPayloadDto (same as damage payload)

- GET /shopkeeper/shops/:shopId/inventory/profit
  - Query: ProfitReportQueryDto (from?, to?)

- POST /shopkeeper/shops/:shopId/inventory
  - Body: CreateInventoryItemDto (create item without category route)

- GET /shopkeeper/shops/:shopId/inventory
- GET /shopkeeper/shops/:shopId/inventory/:itemId
- PATCH /shopkeeper/shops/:shopId/inventory/:itemId
  - Body: UpdateInventoryItemDto (all fields optional)

- DELETE /shopkeeper/shops/:shopId/inventory/:itemId

### Damages (alternate controller)

- POST /shopkeeper/shops/:shopId/damages
  - Body: CreateDamageDto
    - inventoryItemId: UUID
    - quantity: int >=1
    - unitCost?: number
    - reason?: string
    - occurredAt?: Date

- GET /shopkeeper/shops/:shopId/damages
  - Query: ListDamagesQueryDto (inventoryItemId?, from?, to?)

- GET /shopkeeper/shops/:shopId/damages/:damageId

### Expenses

- POST /shopkeeper/shops/:shopId/expenses
  - Body: CreateExpenseDto
    - title: string (required)
    - category?: string
    - amount: number (required)
    - occurredAt?: Date
    - paymentMode?: PaymentMode
    - reference?: string
    - notes?: string

- GET /shopkeeper/shops/:shopId/expenses
  - Query: ListExpensesQueryDto (category?, from?, to?, includeInactive?)

- GET /shopkeeper/shops/:shopId/expenses/:expenseId
- PATCH /shopkeeper/shops/:shopId/expenses/:expenseId
  - Body: UpdateExpenseDto (all optional)

- DELETE /shopkeeper/shops/:shopId/expenses/:expenseId

### Stock Logs

- GET /shopkeeper/shops/:shopId/stock-logs
  - Query: ListStockLogsQueryDto
    - inventoryItemId?: UUID
    - reason?: StockChangeReason
    - from?: Date
    - to?: Date

- GET /shopkeeper/shops/:shopId/stock-logs/:logId

---

## Notes & Next Steps
- For guarded endpoints include `Authorization: Bearer <jwt>` header and ensure the JWT `role` matches the required role.
- Enums used by requests (e.g., `PaymentMode`, `PaymentStatus`, `InventoryTransactionType`, `StockChangeReason`, `KycStatus`, `Role`) are defined under `src/enum`.
- If you want, I can:
  - generate example curl commands for each endpoint,
  - add sample request/response bodies,
  - or convert this to an OpenAPI spec.
