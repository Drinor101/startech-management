# Udhëzues për Konfigurimin e Backend-it Startech

## 🎯 Përmbledhje

Kemi krijuar një backend të plotë Express.js që integrohet me Supabase për aplikacionin Startech. Backend-i ofron API endpoints për të gjitha modulet e sistemit.

## 📁 Struktura e Backend-it

```
backend/
├── config/
│   └── supabase.js          # Konfigurimi i Supabase
├── middleware/
│   └── auth.js              # Middleware për autentifikim
├── routes/
│   ├── users.js             # API për përdoruesit
│   ├── products.js          # API për produktet
│   ├── orders.js            # API për porositë
│   ├── services.js          # API për shërbimet
│   ├── tasks.js             # API për taskat
│   ├── customers.js         # API për klientët
│   └── reports.js           # API për raportet
├── server.js                # Serveri kryesor
├── package.json             # Varësitë dhe scripts
├── database-schema.sql      # Skema e bazës së të dhënave
├── test-api.js              # Skedar për testimin e API-së
└── README.md                # Dokumentacioni i backend-it
```

## 🚀 Hapat për Konfigurimin

### 1. Konfigurimi i Mjedisit

Krijoni skedarin `.env` në dosjen `backend/`:

```env
PORT=3001
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NODE_ENV=development
```

### 2. Konfigurimi i Bazës së të dhënave

1. Shkoni në Supabase Dashboard
2. Hapni SQL Editor
3. Ekzekutoni skriptin `database-schema.sql`
4. Kjo do të krijojë të gjitha tabelat dhe politikat e sigurisë

### 3. Fillimi i Backend-it

```bash
cd backend
npm install
npm run dev
```

Backend-i do të fillojë në `http://localhost:3001`

## 🔗 Integrimi me Frontend

### 1. Përditësimi i Frontend-it

Frontend-i duhet të përdorë API endpoints në vend të mockup data. Këtu janë disa shembuj:

#### Për Produktet:
```javascript
// Në vend të mockProducts
const fetchProducts = async () => {
  const response = await fetch('http://localhost:3001/api/products', {
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Për Porositë:
```javascript
const fetchOrders = async () => {
  const response = await fetch('http://localhost:3001/api/orders', {
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

### 2. Përditësimi i AuthContext

AuthContext duhet të ruajë JWT token-in për t'u përdorur në API calls:

```javascript
// Në AuthContext.tsx
const [token, setToken] = useState(null);

// Pas login të suksesshëm
const { data: { session } } = await supabase.auth.getSession();
setToken(session?.access_token);
```

## 📊 Tabelat e Bazës së të dhënave

### Tabelat e Krijuara:

1. **users** - Përdoruesit e sistemit
2. **products** - Produktet
3. **customers** - Klientët
4. **orders** - Porositë
5. **order_products** - Produktet e porosisë
6. **services** - Shërbimet
7. **service_history** - Historia e shërbimeve
8. **tasks** - Taskat
9. **task_comments** - Komentet e taskave
10. **task_history** - Historia e taskave
11. **user_actions** - Aksionet e përdoruesve

### Siguria:
- **Row Level Security (RLS)** është aktivizuar
- **JWT Authentication** përmes Supabase
- **Role-based Access Control** (admin/user)

## 🔧 API Endpoints

### Autentifikimi
Të gjitha requests duhet të përfshijnë:
```
Authorization: Bearer <supabase_jwt_token>
```

### Endpoints Kryesorë:

#### Users
- `GET /api/users` - Merr të gjithë përdoruesit (admin)
- `GET /api/users/:id` - Merr një përdorues
- `PUT /api/users/:id` - Përditëson përdorues
- `DELETE /api/users/:id` - Fshin përdorues (admin)

#### Products
- `GET /api/products` - Merr produktet
- `POST /api/products` - Krijon produkt (admin)
- `PUT /api/products/:id` - Përditëson produkt (admin)
- `DELETE /api/products/:id` - Fshin produkt (admin)

#### Orders
- `GET /api/orders` - Merr porositë
- `POST /api/orders` - Krijon porosi
- `PUT /api/orders/:id` - Përditëson porosi
- `GET /api/orders/stats/overview` - Statistikat

#### Services
- `GET /api/services` - Merr shërbimet
- `POST /api/services` - Krijon shërbim
- `PUT /api/services/:id` - Përditëson shërbim
- `POST /api/services/:id/history` - Shton histori

#### Tasks
- `GET /api/tasks` - Merr taskat
- `POST /api/tasks` - Krijon task
- `PUT /api/tasks/:id` - Përditëson task
- `POST /api/tasks/:id/comments` - Shton koment

#### Customers
- `GET /api/customers` - Merr klientët
- `POST /api/customers` - Krijon klient
- `PUT /api/customers/:id` - Përditëson klient
- `GET /api/customers/:id/orders` - Porositë e klientit

#### Reports
- `GET /api/reports/dashboard` - Raporti i dashboard-it
- `GET /api/reports/orders` - Raporti i porosive
- `GET /api/reports/services` - Raporti i shërbimeve
- `GET /api/reports/tasks` - Raporti i taskave

## 🧪 Testimi

### 1. Testimi i Backend-it
```bash
cd backend
node test-api.js
```

### 2. Testimi i API-së
```bash
# Health check
curl http://localhost:3001/api/health

# Test me autentifikim (duhet JWT token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3001/api/products
```

## 📝 Hapat e Ardhshëm

1. **Konfiguroni Supabase** me të dhënat tuaja
2. **Ekzekutoni database-schema.sql** në Supabase
3. **Filloni backend-in** me `npm run dev`
4. **Përditësoni frontend-in** për të përdorur API endpoints
5. **Testoni sistemin** e plotë

## 🎉 Përfundimi

Tani keni një backend të plotë që:
- ✅ Integrohet me Supabase
- ✅ Ka autentifikim të sigurt
- ✅ Ofron API për të gjitha modulet
- ✅ Ka siguri të implementuar
- ✅ Është gati për prodhim

Backend-i është gati për t'u integruar me frontend-in dhe për t'u përdorur në prodhim!
