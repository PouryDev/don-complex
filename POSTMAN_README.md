# Postman Collection & Seeder Guide

## راهنمای استفاده

### 1. اجرای Seeder

برای ایجاد داده‌های تستی، دستور زیر را اجرا کنید:

```bash
php artisan migrate:fresh --seed
```

یا اگر migration ها را قبلاً اجرا کرده‌اید:

```bash
php artisan db:seed --class=TestDataSeeder
```

### 2. Import کردن Postman Collection

1. Postman را باز کنید
2. روی Import کلیک کنید
3. فایل `postman_collection.json` را انتخاب کنید
4. Collection import می‌شود

### 3. تنظیم Environment Variables

در Postman، یک Environment ایجاد کنید با متغیرهای زیر:

- `base_url`: `http://localhost:8000` (یا آدرس سرور شما)
- `auth_token`: این به صورت خودکار بعد از login تنظیم می‌شود

### 4. کاربران تستی

Seeder این کاربران را ایجاد می‌کند:

#### Admin
- Email: `admin@mafiacafe.com`
- Password: `password`
- Role: Admin

#### Game Masters
- Email: `gamemaster1@mafiacafe.com`
- Password: `password`
- Role: Game Master (شعبه مرکز)

- Email: `gamemaster2@mafiacafe.com`
- Password: `password`
- Role: Game Master (شعبه شمال)

#### Customers
- Email: `customer1@test.com`
- Password: `password`
- Role: Customer

- Email: `customer2@test.com`
- Password: `password`
- Role: Customer

- Email: `customer3@test.com`
- Password: `password`
- Role: Customer

### 5. استفاده از Collection

1. **ابتدا Login کنید**: از endpoint `POST /api/login` استفاده کنید
   - بعد از login، token به صورت خودکار در متغیر `auth_token` ذخیره می‌شود

2. **سپس سایر endpoints را تست کنید**:
   - تمام endpoints به جز register و login نیاز به authentication دارند
   - Header `Authorization: Bearer {{auth_token}}` به صورت خودکار اضافه می‌شود

### 6. ساختار Collection

Collection شامل این بخش‌هاست:

- **Authentication**: Register, Login, Get User, Logout
- **Branches**: CRUD operations برای شعبه‌ها
- **Halls**: CRUD operations برای سالن‌ها
- **Session Templates**: CRUD operations برای template های سانس
- **Sessions**: لیست، ایجاد، و update سانس‌ها
- **Reservations**: لیست، ایجاد، و cancel رزروها
- **Game Master**: endpoints مخصوص game master

### 7. نکات مهم

- برای تست endpoints که نیاز به admin دارند، با `admin@mafiacafe.com` login کنید
- برای تست endpoints مخصوص game master، با `gamemaster1@mafiacafe.com` login کنید
- برای تست endpoints مخصوص customer، با `customer1@test.com` login کنید

### 8. داده‌های تستی ایجاد شده

Seeder این داده‌ها را ایجاد می‌کند:

- 3 شعبه (Branch)
- 3 سالن (Hall)
- 5 session template
- چندین session (برای روزهای آینده)
- 4 reservation با payment transaction های مرتبط

