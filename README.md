# Gelir Takip

Stüdyo ve Düğün Salonu için günlük gelir takip uygulaması.
Telefonda Chrome'dan **Ana ekrana ekle** ile uygulama gibi kullanılır.

- Ekranlar: `index.html` (tek dosya web uygulaması)
- Sunucu: `api/` klasörü (Vercel üzerinde çalışır, veritabanına sadece o bağlanır)
- Veritabanı: Neon (Postgres)

> ⚠️ Veritabanı bağlantı adresini (`postgresql://...`) **hiçbir dosyaya yazmayın.**
> Sadece Vercel'de `DATABASE_URL` ortam değişkenine girilir.

---

## Kurulum

### 1. Neon (veritabanı)
SQL Editor'da tablolar oluşturulmuş olmalı: `kullanicilar` (username, password) ve `gelirler`.

Şifre değiştirmek için Neon → **Tables → kullanicilar** → `password` hücresi,
veya SQL Editor'da:
```sql
UPDATE kullanicilar SET password = 'yenisifre' WHERE username = 'admin';
```

### 2. GitHub (kodu yükle)
1. github.com → sağ üstte **+** → **New repository**
2. Repository name: `gelir-takip` → **Private** seç → **Create repository**
3. Açılan sayfada **"uploading an existing file"** bağlantısına tıkla
4. Bu klasörün **içindekilerin hepsini** (`api` klasörü dahil) sürükle bırak
5. Altta **Commit changes**

### 3. Vercel (yayınla)
1. vercel.com → **Sign Up** → **Continue with GitHub**
2. **Add New… → Project** → listede `gelir-takip` → **Import**
   (Listede yoksa **Adjust GitHub App Permissions** ile depoya izin ver)
3. **Framework Preset:** `Other` (diğer ayarlar olduğu gibi kalsın)
4. **Environment Variables** bölümünü aç:
   - Name: `DATABASE_URL`
   - Value: Neon → Connect → **Copy snippet** ile kopyalanan adres
5. **Deploy** → 1 dakika içinde `https://gelir-takip-xxxx.vercel.app` adresi verilir

### 4. Telefonda kullan
1. Vercel'in verdiği adresi telefonda **Chrome** ile aç
2. Kullanıcı adı ve şifrenle giriş yap
3. Chrome ⋮ menüsü → **Ana ekrana ekle** (veya **Uygulamayı yükle**)

Yeni bir cihazda sadece kullanıcı adı ve şifre sorulur.

---

## Güncelleme
- Kodda değişiklik: değişen dosyaları GitHub'a yükle → Vercel siteyi **otomatik** günceller.
- Neon adresi değişirse: Vercel → proje → **Settings → Environment Variables** →
  `DATABASE_URL`'i düzenle → **Deployments** → son yayın → **⋯ → Redeploy**.
