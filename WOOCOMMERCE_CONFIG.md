# WooCommerce Configuration - Vetëm Produktet

## Konfigurimi Aktual
Kredencialet e WooCommerce API janë konfiguruar në kod:
- **Consumer Key**: `ck_0856cd7f00ed0c6faef27c9a64256bcf7430d414`
- **Consumer Secret**: `cs_7c882c8e16979743e2dd63fb113759254d47d0aa`

## Konfigurimi i Kërkuar

### 1. WooCommerce Store URL
Duhet të jepni URL-në e dyqanit tuaj WooCommerce. Kjo duhet të jetë URL-ja bazë e faqes suaj WordPress me WooCommerce të instaluar.

**Shembuj URL-sh:**
- `https://yourstore.com`
- `https://shop.example.com`
- `https://yourdomain.com/shop`

### 2. Environment Variables
Shtoni këto variabla në mjedisin e prodhimit (Render):

```bash
WOOCOMMERCE_URL=https://startech24.com
WOOCOMMERCE_CONSUMER_KEY=ck_0856cd7f00ed0c6faef27c9a64256bcf7430d414
WOOCOMMERCE_CONSUMER_SECRET=cs_7c882c8e16979743e2dd63fb113759254d47d0aa
```

### 3. Database Migration
Ekzekutoni migration-in e bazës së të dhënave për të shtuar kolonat e WooCommerce:

```sql
-- Ekzekutoni këtë në Supabase SQL editor
-- (Skedari add-woocommerce-columns.sql përmban migration-in)
```

## Si të Përdoret

### Faqja e Produkteve
1. Shkoni te faqja e Produkteve
2. Klikoni butonin "Sinkronizo me WooCommerce"
3. Produktet do të merren nga dyqani juaj WooCommerce dhe do të sinkronizohen me bazën e të dhënave
4. Do të shihni treguesit e statusit (sinkronizim, sukses, gabim)

## Veçoritë

### Sinkronizimi i Produkteve
- Merr të gjitha produktet e publikuara nga WooCommerce
- Harton të dhënat e produkteve WooCommerce në skemën tuaj të bazës së të dhënave
- Përditëson produktet ekzistuese ose krijon të reja
- Trajton imazhet e produkteve, kategoritë dhe çmimet
- Ruan ID-në e WooCommerce për referencë të ardhshme

## Troubleshooting

### Problemet e Zakonshme
1. **401 Unauthorized**: Kontrolloni Consumer Key dhe Secret
2. **404 Not Found**: Verifikoni që URL-ja e WooCommerce është e saktë
3. **CORS Issues**: Sigurohuni që dyqani juaj WooCommerce lejon aksesin e API
4. **Empty Results**: Kontrolloni nëse dyqani ka produkte

### Testimi
Mund ta testoni lidhjen duke kontrolluar konsolën e shfletuesit për përgjigjet e API dhe mesazhet e gabimeve.

## Hapat e Ardhshëm
1. Jepni URL-në e dyqanit tuaj WooCommerce
2. Shtoni variablat e mjedisit në Render
3. Ekzekutoni migration-in e bazës së të dhënave
4. Testoni funksionalitetin e sinkronizimit
