# 🚂 Railway Deployment Guide

## Hapat për Deploy në Railway

### 1. Përgatitja e Projektit

Projekti është tashmë i përgatitur për Railway me:
- ✅ `railway.json` - Konfigurimi i Railway
- ✅ `Procfile` - Komanda për start
- ✅ `package.json` - Me scripts dhe dependencies
- ✅ ES Modules support

### 2. Deploy në Railway

#### Opsioni A: Nëpërmjet Railway CLI

```bash
# Instalo Railway CLI
npm install -g @railway/cli

# Login në Railway
railway login

# Navigo në backend directory
cd backend

# Deploy
railway up
```

#### Opsioni B: Nëpërmjet Railway Dashboard

1. Shko në [railway.app](https://railway.app)
2. Kliko "New Project"
3. Zgjidh "Deploy from GitHub repo"
4. Zgjidh repository-n tënd
5. Zgjidh `backend` folder si root directory

### 3. Environment Variables

Në Railway Dashboard, shto këto environment variables:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
PORT=3001
```

### 4. Domain Configuration

Railway do të japë një URL si:
`https://your-app-name.railway.app`

### 5. Testimi

Pas deploy, testo:
```bash
curl https://your-app-name.railway.app/api/health
```

Duhet të kthejë:
```json
{
  "status": "OK",
  "message": "Startech Backend API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 Troubleshooting

### Gabim: "Cannot find module"
- Sigurohu që `package.json` ka `"type": "module"`
- Sigurohu që të gjitha import statements përdorin `.js` extensions

### Gabim: "Port already in use"
- Railway automatikisht vendos `PORT` environment variable
- Mos e hardcode portin në kod

### Gabim: CORS
- Shto domain-in e frontend-it në CORS origins
- Për Netlify: `https://your-app.netlify.app`

## 📝 Notes

- Railway ofron 500 orë falas në muaj
- Auto-deploy kur bën push në main branch
- Logs janë të disponueshme në Railway Dashboard
- SSL certificate është automatik
