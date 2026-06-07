# Kirana server context

Updated: 2026-05-30
Root: d:/Projects/Kirana/server
OS: Windows
Current editor file: src/security/guards/jwt-auth.guard.ts

## Project vision (refined)

One-stop platform for a kirana store chain, connecting suppliers, shopkeepers, delivery partners, and customers.

Actors and responsibilities:
- Supplier: maintains stock catalog, fulfills restock requests from shopkeepers.
- Shopkeeper: manages inventory, categories, employees, billing, and store operations.
- Delivery partner: receives delivery requests, bids for travel expense, and delivers orders.
- Customer: views nearby shops and their inventory, orders online or for takeaway.

Core flows:
- Restocking: shopkeeper requests stock; supplier approves and fulfills.
- Store operations: inventory updates, category management, employee management, and billing.
- Ordering: customer places order; shopkeeper processes; delivery partner bids and delivers.

Future ML features:
- Demand forecasting for shop inventory planning.
- Personalized recommendations for customers.

## Structure (source + config)

```
.
├── eslint.config.mjs
├── nest-cli.json
├── package.json
├── package-lock.json
├── prisma.config.ts
├── README.md
├── tsconfig.build.json
├── tsconfig.json
├── .prettierrc
├── .gitignore
├── generated/
│   └── prisma/
│       ├── browser.ts
│       ├── client.ts
│       ├── commonInputTypes.ts
│       ├── enums.ts
│       ├── models.ts
│       ├── internal/
│       │   ├── class.ts
│       │   ├── prismaNamespace.ts
│       │   └── prismaNamespaceBrowser.ts
│       └── models/
│           ├── Shop.ts
│           ├── Shopkeeper.ts
│           └── User.ts
├── prisma/
│   ├── schema.prisma
│   ├── ca.pem
│   └── migrations/
│       ├── migration_lock.toml
│       ├── 20260528154916_init/
│       │   └── migration.sql
│       ├── 20260528181128_add_shopkeeper_and_shops/
│       │   └── migration.sql
│       └── 20260528181907_add_shopkeeper_profile_fields/
│           └── migration.sql
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.controller.spec.ts
│   ├── app.service.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.controller.spec.ts
│   │   ├── auth.service.ts
│   │   ├── auth.service.spec.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   ├── enum/
│   │   ├── kyc-status.enum.ts
│   │   └── role.enum.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts
│   │   └── prisma.service.spec.ts
│   ├── security/
│   │   ├── security.module.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   ├── bcrypt/
│   │   │   └── bcrypt.service.ts
│   │   ├── jwt/
│   │   │   └── jwt.service.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts
│   │       └── roles.guard.ts
│   ├── shopkeeper/
│   │   ├── shopkeeper.module.ts
│   │   ├── profile/
│   │   │   ├── profile.module.ts
│   │   │   ├── profile.controller.ts
│   │   │   ├── profile.service.ts
│   │   │   └── dto/
│   │   │       └── update-profile.dto.ts
│   │   └── shop/
│   │       ├── shop.module.ts
│   │       ├── shop.controller.ts
│   │       ├── shop.service.ts
│   │       └── dto/
│   │           ├── create-shop.dto.ts
│   │           └── update-shop.dto.ts
│   └── user/
│       ├── user.module.ts
│       ├── user.service.ts
│       └── user.service.spec.ts
└── test/
    ├── app.e2e-spec.ts
    └── jest-e2e.json
```

Notes:
- dist/ and node_modules/ exist but contents are omitted to avoid noise.
- generated/ contains Prisma client artifacts; treat as generated output unless asked.

## Instructions for future work

- Always read relevant files before edits; do not guess.
- Prefer changing source in src/ and prisma/schema.prisma.
- Treat generated/ and dist/ as generated outputs unless explicitly asked.
- Avoid editing node_modules/.
- Ask before running Prisma migrations or other destructive actions.
- If a file or symbol is missing, ask for clarification.
