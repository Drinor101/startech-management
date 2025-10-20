# Sistemi i Komenteve - Dokumentacion

## Përshkrimi
Sistemi i komenteve është implementuar për të lejuar përdoruesit të komentojnë në **Kërkesat**, **Servisi**, dhe **Tiketat**. Sistemi përfshin:

- ✅ **Komentet kryesore** (root comments)
- ✅ **Përgjigjet** (replies) për komente
- ✅ **Votimi** (upvote/downvote) për komente
- ✅ **Sortimi** (më të fundit, më të vjetër, më të popullarë)
- ✅ **Formatimi** i tekstit (bold, italic, underline, etj.)
- ✅ **Real-time updates** kur shtohen komente të reja

## Komponentet e Krijuara

### 1. CommentsSection.tsx
**Vendndodhja**: `src/components/Common/CommentsSection.tsx`

**Funksionalitetet**:
- Shfaq komente me avatar dhe informacione për përdoruesin
- Lejon shtimin e komenteve të reja
- Lejon përgjigjen e komenteve (replies)
- Lejon votimin e komenteve (upvote/downvote)
- Sortimi i komenteve sipas kohës ose popullaritetit
- Formatimi i tekstit me toolbar

### 2. Backend API
**Vendndodhja**: `backend/routes/comments.js`

**Endpoints**:
- `GET /api/comments?entityType=task&entityId=123` - Merr komente
- `POST /api/comments` - Krijo koment të ri
- `POST /api/comments/:id/vote` - Voto koment
- `PUT /api/comments/:id` - Përditëso koment
- `DELETE /api/comments/:id` - Fshi koment

### 3. Database Schema
**Vendndodhja**: `backend/comments-schema.sql`

**Tabelat**:
- `comments` - Komentet kryesore
- `comment_votes` - Votimet e përdoruesve

## Integrimi në Formulat

### TaskForm (Kërkesat)
- Komentet shfaqen vetëm për tasket ekzistuese (jo për tasket e reja)
- Vendndodhja: Në fund të formës, para Notification

### ServiceForm (Servisi)
- Komentet shfaqen vetëm për serviset ekzistuese (jo për serviset e reja)
- Vendndodhja: Në fund të formës, para Notification

### TicketForm (Tiketat)
- Komentet shfaqen vetëm për tiketat ekzistuese (jo për tiketat e reja)
- Vendndodhja: Në fund të formës, para Notification

## Si të Përdoret

### 1. Për Përdoruesit
1. **Hap një task/service/ticket ekzistues**
2. **Shkruaj komentin** në fushën "Shto koment..."
3. **Përdor toolbar-in** për formatimin e tekstit
4. **Kliko "Dërgo"** për të shtuar komentin
5. **Voto komentet** me thumbs up/down
6. **Përgjigju komenteve** duke klikuar "Përgjigju"

### 2. Për Zhvilluesit
```typescript
// Shto CommentsSection në një form
<CommentsSection
  entityType="task" // ose "service", "ticket"
  entityId={task.id}
  currentUser={{
    id: currentUser?.id || '',
    name: currentUser?.name || 'Përdorues',
    avatar: currentUser?.avatar_url
  }}
/>
```

## Konfigurimi i Database

### 1. Ekzekuto SQL Schema
```sql
-- Ekzekuto skedarin backend/comments-schema.sql
-- Kjo do të krijojë tabelat e nevojshme
```

### 2. Shto Route në Server
```javascript
// backend/server.js
const commentRoutes = (await import('./routes/comments.js')).default;
app.use('/api/comments', commentRoutes);
```

## Siguria

### Row Level Security (RLS)
- Përdoruesit mund të shohin të gjitha komentet
- Përdoruesit mund të krijojnë komente të reja
- Përdoruesit mund të modifikojnë vetëm komentet e tyre
- Përdoruesit mund të fshijnë vetëm komentet e tyre

### Validimi
- `entityType` duhet të jetë: 'task', 'service', ose 'ticket'
- `entityId` duhet të ekzistojë në tabelën përkatëse
- `content` nuk mund të jetë bosh
- `voteType` duhet të jetë: 'upvote' ose 'downvote'

## Performanca

### Optimizimet
- **Indexes** në database për kërkime të shpejta
- **Pagination** për komente (mund të shtohet në të ardhmen)
- **Caching** për komente të shpeshta (mund të shtohet në të ardhmen)

### Kufizimet
- Komentet nuk kanë pagination (të gjitha shfaqen njëherësh)
- Nuk ka real-time updates (duhet refresh manual)

## Troubleshooting

### Problemet e Zakonshme
1. **Komentet nuk shfaqen**: Kontrollo nëse `entityId` është i saktë
2. **Votimi nuk funksionon**: Kontrollo nëse përdoruesi është i loguar
3. **Komenti nuk shtohet**: Kontrollo nëse `content` nuk është bosh

### Logs
- Backend logs: `console.log` në `backend/routes/comments.js`
- Frontend logs: `console.log` në `CommentsSection.tsx`

## E Ardhshme

### Mund të Shtohen
- **Real-time updates** me WebSocket
- **Pagination** për komente
- **File attachments** në komente
- **Mention system** (@username)
- **Email notifications** për komente të reja
- **Rich text editor** më i avancuar
- **Moderation tools** për admin

### Optimizimet
- **Caching** për komente të shpeshta
- **Lazy loading** për komente të vjetra
- **Search** në komente
- **Export** komentesh në PDF/Excel
