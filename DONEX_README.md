# باشگاه مشتریان دنکس (DonEx)

## مقدمه

**دنکس** (DonEx) سیستم باشگاه مشتریان دن کلاب است که به کاربران امکان می‌دهد با تعامل با اپلیکیشن، سکه کسب کرده و از مزایای ویژه بهره‌مند شوند.

## ویژگی‌ها

### 1. کسب سکه
کاربران می‌توانند از طریق فعالیت‌های زیر سکه دنکس دریافت کنند:
- **پاسخ به کوییز**: ۱۰ سکه
- **پر کردن فرم**: ۵ سکه
- **رزرو و پرداخت موفق سانس**: ۲۰ سکه
- **مشاهده محتوای فید**: ۲ سکه (محدودیت: یک بار در روز برای هر محتوا)

### 2. مصرف سکه
کاربران می‌توانند سکه‌های خود را برای خرید موارد زیر استفاده کنند:
- **کدهای تخفیف**: خرید کدهای تخفیف درصدی یا مبلغی با سکه
- **بلیط رایگان**: خرید بلیط رایگان برای رزرو سانس (۱۰۰ سکه)

### 3. کدهای تخفیف
- پشتیبانی از تخفیف درصدی و مبلغ ثابت
- تنظیم حداقل مبلغ سفارش
- محدودیت تعداد استفاده
- تاریخ انقضا
- تخفیف‌های نمونه موجود:
  - WELCOME10: ۱۰٪ تخفیف (۵۰ سکه)
  - SAVE20: ۲۰٪ تخفیف (۱۰۰ سکه)
  - FIXED50000: ۵۰۰۰۰ تومان تخفیف (۱۵۰ سکه)
  - VIP30: ۳۰٪ تخفیف (۲۰۰ سکه)

### 4. بلیط‌های رایگان
- خرید با ۱۰۰ سکه
- قابل استفاده برای هر سانس دلخواه
- بدون تاریخ انقضا (مگر اینکه در تنظیمات فعال شود)

## معماری

### Backend (Laravel)

#### Models
- `Coin`: مدیریت موجودی سکه کاربران
- `CoinTransaction`: ثبت تاریخچه تراکنش‌های سکه
- `CoinRewardRule`: قوانین پاداش سکه برای هر فعالیت
- `DiscountCode`: کدهای تخفیف
- `UserDiscountCode`: کدهای تخفیف خریداری شده توسط کاربر
- `FreeTicket`: بلیط‌های رایگان

#### Services
- `CoinService`: مدیریت اعطا و مصرف سکه
- `DiscountCodeService`: مدیریت کدهای تخفیف
- `FreeTicketService`: مدیریت بلیط‌های رایگان

#### API Endpoints

**Coins**
```
GET    /api/coins/balance          - دریافت موجودی سکه
GET    /api/coins/history          - تاریخچه تراکنش‌ها
```

**Discount Codes**
```
GET    /api/discount-codes                  - لیست کدهای موجود
POST   /api/discount-codes/{id}/purchase    - خرید کد تخفیف
GET    /api/discount-codes/my-codes         - کدهای خریداری شده
POST   /api/discount-codes/validate         - اعتبارسنجی کد
```

**Free Tickets**
```
GET    /api/free-tickets                    - لیست بلیط‌های کاربر
POST   /api/free-tickets/purchase           - خرید بلیط رایگان
POST   /api/free-tickets/{id}/use           - استفاده از بلیط
```

**Feed Tracking**
```
POST   /api/feed/{type}/{id}/view           - ثبت مشاهده محتوا
```

### Frontend (React)

#### Pages
- `CoinHistory`: تاریخچه سکه‌ها
- `DiscountCodes`: مدیریت کدهای تخفیف
- `FreeTickets`: مدیریت بلیط‌های رایگان

#### Components
- `CoinBalance`: نمایش موجودی سکه در هدر

#### Routes
```
/coin-history       - تاریخچه سکه‌ها
/discount-codes     - کدهای تخفیف
/free-tickets       - بلیط‌های رایگان
```

## بهینه‌سازی عملکرد

سیستم با تمرکز بر عملکرد بالا طراحی شده است:

### Database Indexing
- تمام کلیدهای خارجی دارای index
- Index‌های composite برای query‌های پرتکرار
- Index unique برای کدهای تخفیف

### Caching
- موجودی سکه: 60 ثانیه
- کدهای تخفیف: 5 دقیقه
- قوانین پاداش: 1 ساعت

### Query Optimization
- استفاده از Eager Loading
- تراکنش‌های دیتابیس برای عملیات‌های حساس
- استفاده از `lockForUpdate` برای جلوگیری از race condition

### زمان پاسخ
- هدف: کمتر از 50ms برای تمام endpoint‌ها
- استفاده از select() برای محدود کردن ستون‌ها
- Pagination با حداکثر 20 آیتم در صفحه

## امنیت

### جلوگیری از سوءاستفاده
- Rate limiting برای مشاهده فید (یک بار در روز)
- جلوگیری از دریافت مجدد سکه برای همان فعالیت
- استفاده از database transactions
- Lock کردن رکورد سکه هنگام مصرف

### اعتبارسنجی
- بررسی موجودی قبل از مصرف
- بررسی تاریخ انقضا کدهای تخفیف
- بررسی محدودیت استفاده کدهای تخفیف
- بررسی وضعیت فعال بودن قوانین پاداش

## نصب و راه‌اندازی

### 1. Migration
```bash
php artisan migrate
```

### 2. Seed
```bash
php artisan db:seed --class=CoinRewardRuleSeeder
php artisan db:seed --class=DiscountCodeSeeder
```

### 3. Build Frontend
```bash
npm run build
```

## تنظیمات

### تغییر مقدار سکه‌ها
می‌توانید مقدار سکه‌ها را از طریق جدول `coin_reward_rules` تغییر دهید:

```sql
UPDATE coin_reward_rules 
SET coins = 15 
WHERE rewardable_type = 'App\\Models\\Quiz';
```

### افزودن کد تخفیف جدید
```php
DiscountCode::create([
    'code' => 'NEWYEAR2026',
    'type' => 'percentage',
    'value' => 25,
    'min_order_amount' => 100000,
    'max_uses' => 100,
    'coins_cost' => 150,
    'expires_at' => '2026-12-31',
]);
```

### تغییر قیمت بلیط رایگان
قیمت بلیط رایگان در فایل `FreeTickets.jsx` قابل تغییر است:
```javascript
const TICKET_PRICE = 100; // تغییر این مقدار
```

## گزارش‌گیری

### آمار کسب سکه
```php
$stats = CoinTransaction::select('source', DB::raw('SUM(amount) as total'))
    ->where('type', 'earned')
    ->groupBy('source')
    ->get();
```

### محبوب‌ترین کدهای تخفیف
```php
$popular = UserDiscountCode::select('discount_code_id', DB::raw('COUNT(*) as count'))
    ->groupBy('discount_code_id')
    ->orderBy('count', 'desc')
    ->with('discountCode')
    ->take(10)
    ->get();
```

## نکات مهم

1. **موجودی اولیه**: همه کاربران با موجودی صفر شروع می‌کنند
2. **تاریخ انقضا**: سکه‌ها تاریخ انقضا ندارند (قابل تغییر در آینده)
3. **محدودیت روزانه**: فقط برای مشاهده فید اعمال می‌شود
4. **استفاده مجدد**: کدهای تخفیف فقط یک بار قابل استفاده هستند
5. **بلیط رایگان**: هنگام رزرو، گزینه استفاده از بلیط نمایش داده می‌شود

## پشتیبانی و توسعه

برای سوالات یا پیشنهادات، با تیم توسعه تماس بگیرید.

---

**نسخه**: 1.0.0  
**آخرین به‌روزرسانی**: ۱۴۰۴/۱۱/۱۱  
**توسعه‌دهنده**: Don Club Development Team

