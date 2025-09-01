# Startech Backend API

Backend API për aplikacionin Startech, i ndërtuar me Express.js dhe Supabase.

## 🚀 Fillimi i shpejtë

### 1. Instalimi i varësive
```bash
npm install
```

### 2. Konfigurimi i mjedisit
Krijoni një skedar `.env` në dosjen `backend/` me përmbajtjen e mëposhtme:

```env
PORT=3001
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NODE_ENV=development
```

### 3. Konfigurimi i bazës së të dhënave
1. Shkoni në Supabase Dashboard
2. Hapni SQL Editor
3. Ekzekutoni skriptin `database-schema.sql`

### 4. Fillimi i serverit
```bash
# Për zhvillim (me nodemon)
npm run dev

# Për prodhim
npm start
```

## 📚 API Endpoints

### Autentifikimi
Të gjitha requests duhet të përfshijnë header-in:
```
Authorization: Bearer <supabase_jwt_token>
```

### Users
- `GET /api/users` - Merr të gjithë përdoruesit (admin)
- `GET /api/users/:id` - Merr një përdorues specifik
- `PUT /api/users/:id` - Përditëson një përdorues
- `DELETE /api/users/:id` - Fshin një përdorues (admin)

### Products
- `GET /api/products` - Merr të gjithë produktet
- `GET /api/products/:id` - Merr një produkt specifik
- `POST /api/products` - Krijon një produkt të ri (admin)
- `PUT /api/products/:id` - Përditëson një produkt (admin)
- `DELETE /api/products/:id` - Fshin një produkt (admin)
- `POST /api/products/sync-woocommerce` - Sinkronizon me WooCommerce (admin)

### Orders
- `GET /api/orders` - Merr të gjithë porositë
- `GET /api/orders/:id` - Merr një porosi specifike
- `POST /api/orders` - Krijon një porosi të re
- `PUT /api/orders/:id` - Përditëson një porosi
- `DELETE /api/orders/:id` - Fshin një porosi (admin)
- `GET /api/orders/stats/overview` - Merr statistikat e porosive

### Services
- `GET /api/services` - Merr të gjithë shërbimet
- `GET /api/services/:id` - Merr një shërbim specifik
- `POST /api/services` - Krijon një shërbim të ri
- `PUT /api/services/:id` - Përditëson një shërbim
- `DELETE /api/services/:id` - Fshin një shërbim (admin)
- `POST /api/services/:id/history` - Shton hyrje në histori
- `GET /api/services/stats/overview` - Merr statistikat e shërbimeve

### Tasks
- `GET /api/tasks` - Merr të gjithë taskat
- `GET /api/tasks/:id` - Merr një task specifik
- `POST /api/tasks` - Krijon një task të ri
- `PUT /api/tasks/:id` - Përditëson një task
- `DELETE /api/tasks/:id` - Fshin një task (admin)
- `POST /api/tasks/:id/comments` - Shton koment në task
- `GET /api/tasks/stats/overview` - Merr statistikat e taskave

### Customers
- `GET /api/customers` - Merr të gjithë klientët
- `GET /api/customers/:id` - Merr një klient specifik
- `POST /api/customers` - Krijon një klient të ri
- `PUT /api/customers/:id` - Përditëson një klient
- `DELETE /api/customers/:id` - Fshin një klient (admin)
- `GET /api/customers/:id/orders` - Merr porositë e klientit
- `GET /api/customers/:id/services` - Merr shërbimet e klientit
- `GET /api/customers/stats/overview` - Merr statistikat e klientëve

### Reports
- `GET /api/reports/dashboard` - Merr raportin e dashboard-it
- `GET /api/reports/orders` - Merr raportin e porosive
- `GET /api/reports/services` - Merr raportin e shërbimeve
- `GET /api/reports/tasks` - Merr raportin e taskave
- `GET /api/reports/customers` - Merr raportin e klientëve
- `GET /api/reports/products` - Merr raportin e produkteve

### Health Check
- `GET /api/health` - Kontrollon gjendjen e API-së

## 🔒 Siguria

- **Row Level Security (RLS)** është aktivizuar për të gjitha tabelat
- **JWT Authentication** përmes Supabase
- **Role-based Access Control** (admin/user)
- **CORS** i konfiguruar për frontend-in
- **Helmet** për siguri HTTP headers

## 📊 Bazë e të dhënave

Tabelat e krijuara:
- `users` - Përdoruesit e sistemit
- `products` - Produktet
- `customers` - Klientët
- `orders` - Porositë
- `order_products` - Produktet e porosisë
- `services` - Shërbimet
- `service_history` - Historia e shërbimeve
- `tasks` - Taskat
- `task_comments` - Komentet e taskave
- `task_history` - Historia e taskave
- `user_actions` - Aksionet e përdoruesve

## 🛠️ Zhvillimi

### Struktura e dosjeve
```
backend/
├── config/
│   └── supabase.js
├── middleware/
│   └── auth.js
├── routes/
│   ├── users.js
│   ├── products.js
│   ├── orders.js
│   ├── services.js
│   ├── tasks.js
│   ├── customers.js
│   └── reports.js
├── server.js
├── package.json
└── README.md
```

### Scripts
- `npm run dev` - Fillon serverin në modalitetin e zhvillimit
- `npm start` - Fillon serverin në modalitetin e prodhimit

## 🌐 Integrimi me Frontend

Frontend-i duhet të dërgojë JWT token-in në header-in `Authorization` për çdo request:

```javascript
const response = await fetch('http://localhost:3001/api/products', {
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  }
});
```

## 📝 Shënime

- Serveri funksionon në portin 3001 si parazgjedhje
- Të gjitha përgjigjet janë në formatin JSON
- Gabimet janë të standardizuara me mesazhe në shqip
- Paginimi është i implementuar për të gjitha listat
