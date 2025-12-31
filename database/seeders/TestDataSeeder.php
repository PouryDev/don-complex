<?php

namespace Database\Seeders;

use App\Enums\PaymentStatus;
use App\Enums\SessionStatus;
use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Hall;
use App\Models\MenuItem;
use App\Models\PaymentTransaction;
use App\Models\Reservation;
use App\Models\Session;
use App\Models\SessionTemplate;
use App\Models\User;
use App\Services\SessionService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create Users
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@mafiacafe.com',
            'password' => Hash::make('password'),
            'role' => UserRole::ADMIN,
            'phone' => '09123456789',
        ]);

        $gameMaster1 = User::create([
            'name' => 'Game Master 1',
            'email' => 'gamemaster1@mafiacafe.com',
            'password' => Hash::make('password'),
            'role' => UserRole::GAME_MASTER,
            'phone' => '09123456790',
        ]);

        $gameMaster2 = User::create([
            'name' => 'Game Master 2',
            'email' => 'gamemaster2@mafiacafe.com',
            'password' => Hash::make('password'),
            'role' => UserRole::GAME_MASTER,
            'phone' => '09123456791',
        ]);

        $customer1 = User::create([
            'name' => 'Customer 1',
            'email' => 'customer1@test.com',
            'password' => Hash::make('password'),
            'role' => UserRole::CUSTOMER,
            'phone' => '09123456792',
        ]);

        $customer2 = User::create([
            'name' => 'Customer 2',
            'email' => 'customer2@test.com',
            'password' => Hash::make('password'),
            'role' => UserRole::CUSTOMER,
            'phone' => '09123456793',
        ]);

        $customer3 = User::create([
            'name' => 'Customer 3',
            'email' => 'customer3@test.com',
            'password' => Hash::make('password'),
            'role' => UserRole::CUSTOMER,
            'phone' => '09123456794',
        ]);

        // Create Branches
        $branch1 = Branch::create([
            'name' => 'شعبه مرکز',
            'address' => 'تهران، میدان آزادی، خیابان آزادی',
            'game_master_id' => $gameMaster1->id,
        ]);

        $branch2 = Branch::create([
            'name' => 'شعبه شمال',
            'address' => 'تهران، میدان ونک، خیابان ونک',
            'game_master_id' => $gameMaster2->id,
        ]);

        $branch3 = Branch::create([
            'name' => 'شعبه جنوب',
            'address' => 'تهران، میدان انقلاب، خیابان انقلاب',
            'game_master_id' => null, // No game master assigned yet
        ]);

        // Create Halls
        $hall1 = Hall::create([
            'branch_id' => $branch1->id,
            'name' => 'سالن اصلی',
            'capacity' => 20,
        ]);

        $hall2 = Hall::create([
            'branch_id' => $branch1->id,
            'name' => 'سالن VIP',
            'capacity' => 10,
        ]);

        $hall3 = Hall::create([
            'branch_id' => $branch2->id,
            'name' => 'سالن اصلی',
            'capacity' => 15,
        ]);

        // Create Session Templates
        $template1 = SessionTemplate::create([
            'hall_id' => $hall1->id,
            'day_of_week' => 1, // Monday
            'start_time' => '18:00:00',
            'price' => 50000,
            'max_participants' => 10,
            'is_active' => true,
        ]);

        $template2 = SessionTemplate::create([
            'hall_id' => $hall1->id,
            'day_of_week' => 1, // Monday
            'start_time' => '20:00:00',
            'price' => 60000,
            'max_participants' => 12,
            'is_active' => true,
        ]);

        $template3 = SessionTemplate::create([
            'hall_id' => $hall1->id,
            'day_of_week' => 3, // Wednesday
            'start_time' => '19:00:00',
            'price' => 55000,
            'max_participants' => 10,
            'is_active' => true,
        ]);

        $template4 = SessionTemplate::create([
            'hall_id' => $hall2->id,
            'day_of_week' => 5, // Friday
            'start_time' => '20:00:00',
            'price' => 80000,
            'max_participants' => 8,
            'is_active' => true,
        ]);

        $template5 = SessionTemplate::create([
            'hall_id' => $hall3->id,
            'day_of_week' => 2, // Tuesday
            'start_time' => '19:00:00',
            'price' => 50000,
            'max_participants' => 10,
            'is_active' => true,
        ]);

        // Generate recurring sessions from templates for the next 8 weeks (56 days)
        $sessionService = app(SessionService::class);
        $today = Carbon::today();
        $endDate = $today->copy()->addWeeks(8); // 8 weeks ahead
        
        $this->command->info('Generating recurring sessions from templates...');
        $generatedSessions = $sessionService->generateSessionsFromTemplates($today, $endDate);
        $this->command->info("Generated {$generatedSessions->count()} sessions from templates.");

        // Get some specific sessions for creating reservations
        // Find the first Monday session from template1
        $monday1 = Session::where('session_template_id', $template1->id)
            ->where('date', '>=', $today->format('Y-m-d'))
            ->orderBy('date')
            ->orderBy('start_time')
            ->first();

        // Find the first Monday session from template2
        $monday2 = Session::where('session_template_id', $template2->id)
            ->where('date', '>=', $today->format('Y-m-d'))
            ->orderBy('date')
            ->orderBy('start_time')
            ->first();

        // Find the first Wednesday session from template3
        $wednesday = Session::where('session_template_id', $template3->id)
            ->where('date', '>=', $today->format('Y-m-d'))
            ->orderBy('date')
            ->orderBy('start_time')
            ->first();

        // Create one-time session (no template) for testing
        $oneTimeSession = Session::create([
            'branch_id' => $branch2->id,
            'hall_id' => $hall3->id,
            'session_template_id' => null,
            'date' => $today->copy()->addDays(3)->format('Y-m-d'),
            'start_time' => '19:00:00',
            'price' => 45000,
            'max_participants' => 10,
            'current_participants' => 0,
            'status' => SessionStatus::UPCOMING,
        ]);

        // Create Reservations and Payment Transactions (only if sessions were found)
        $reservation1 = null;
        $reservation2 = null;
        $reservation3 = null;
        $reservation4 = null;

        if ($monday1) {
            $reservation1 = Reservation::create([
                'user_id' => $customer1->id,
                'session_id' => $monday1->id,
                'number_of_people' => 3,
                'payment_status' => PaymentStatus::PAID,
            ]);

            $monday1->increment('current_participants', 3);

            $reservation2 = Reservation::create([
                'user_id' => $customer2->id,
                'session_id' => $monday1->id,
                'number_of_people' => 2,
                'payment_status' => PaymentStatus::PAID,
            ]);

            $monday1->increment('current_participants', 2);

            // Create Payment Transactions for Monday sessions
            if ($reservation1) {
                $payment1 = PaymentTransaction::create([
                    'reservation_id' => $reservation1->id,
                    'amount' => 150000, // 3 * 50000
                    'gateway' => 'zarinpal',
                    'gateway_transaction_id' => 'ZP123456789',
                    'status' => PaymentStatus::PAID,
                    'metadata' => ['ref_id' => 'REF123'],
                ]);
                $reservation1->update(['payment_transaction_id' => $payment1->id]);
            }

            if ($reservation2) {
                $payment2 = PaymentTransaction::create([
                    'reservation_id' => $reservation2->id,
                    'amount' => 100000, // 2 * 50000
                    'gateway' => 'zarinpal',
                    'gateway_transaction_id' => 'ZP123456790',
                    'status' => PaymentStatus::PAID,
                    'metadata' => ['ref_id' => 'REF124'],
                ]);
                $reservation2->update(['payment_transaction_id' => $payment2->id]);
            }
        }

        if ($monday2) {
            $reservation3 = Reservation::create([
                'user_id' => $customer3->id,
                'session_id' => $monday2->id,
                'number_of_people' => 4,
                'payment_status' => PaymentStatus::PENDING,
            ]);

            $monday2->increment('current_participants', 4);

            if ($reservation3) {
                $payment3 = PaymentTransaction::create([
                    'reservation_id' => $reservation3->id,
                    'amount' => 240000, // 4 * 60000
                    'gateway' => null,
                    'gateway_transaction_id' => null,
                    'status' => PaymentStatus::PENDING,
                    'metadata' => null,
                ]);
                $reservation3->update(['payment_transaction_id' => $payment3->id]);
            }
        }

        if ($wednesday) {
            $reservation4 = Reservation::create([
                'user_id' => $customer1->id,
                'session_id' => $wednesday->id,
                'number_of_people' => 2,
                'payment_status' => PaymentStatus::PAID,
            ]);

            $wednesday->increment('current_participants', 2);

            if ($reservation4) {
                $payment4 = PaymentTransaction::create([
                    'reservation_id' => $reservation4->id,
                    'amount' => 110000, // 2 * 55000
                    'gateway' => 'mellat',
                    'gateway_transaction_id' => 'ML987654321',
                    'status' => PaymentStatus::PAID,
                    'metadata' => ['ref_id' => 'REF125'],
                ]);
                $reservation4->update(['payment_transaction_id' => $payment4->id]);
            }
        }

        // Create Categories (only if they don't exist)
        $category1 = Category::firstOrCreate(
            ['name' => 'نوشیدنی‌ها'],
            ['order' => 1, 'is_active' => true]
        );

        $category2 = Category::firstOrCreate(
            ['name' => 'غذاهای اصلی'],
            ['order' => 2, 'is_active' => true]
        );

        $category3 = Category::firstOrCreate(
            ['name' => 'پیش‌غذا'],
            ['order' => 3, 'is_active' => true]
        );

        $category4 = Category::firstOrCreate(
            ['name' => 'دسر'],
            ['order' => 4, 'is_active' => true]
        );

        $category5 = Category::firstOrCreate(
            ['name' => 'اسنک'],
            ['order' => 5, 'is_active' => true]
        );

        // Create Menu Items
        // نوشیدنی‌ها
        MenuItem::create([
            'category_id' => $category1->id,
            'name' => 'قهوه اسپرسو',
            'description' => 'قهوه اسپرسو تازه دم شده',
            'ingredients' => 'دانه قهوه، آب',
            'price' => 25000,
            'is_available' => true,
            'order' => 1,
        ]);

        MenuItem::create([
            'category_id' => $category1->id,
            'name' => 'کاپوچینو',
            'description' => 'قهوه با شیر و فوم',
            'ingredients' => 'اسپرسو، شیر، فوم شیر',
            'price' => 35000,
            'is_available' => true,
            'order' => 2,
        ]);

        MenuItem::create([
            'category_id' => $category1->id,
            'name' => 'لاته',
            'description' => 'قهوه با شیر',
            'ingredients' => 'اسپرسو، شیر',
            'price' => 32000,
            'is_available' => true,
            'order' => 3,
        ]);

        MenuItem::create([
            'category_id' => $category1->id,
            'name' => 'آبمیوه طبیعی',
            'description' => 'آبمیوه تازه فشرده شده',
            'ingredients' => 'میوه تازه',
            'price' => 40000,
            'is_available' => true,
            'order' => 4,
        ]);

        MenuItem::create([
            'category_id' => $category1->id,
            'name' => 'چای',
            'description' => 'چای ایرانی',
            'ingredients' => 'برگ چای، آب',
            'price' => 15000,
            'is_available' => true,
            'order' => 5,
        ]);

        // غذاهای اصلی
        MenuItem::create([
            'category_id' => $category2->id,
            'name' => 'پاستا کاربونارا',
            'description' => 'پاستا با سس خامه و بیکن',
            'ingredients' => 'پاستا، خامه، بیکن، پنیر پارمزان',
            'price' => 120000,
            'is_available' => true,
            'order' => 1,
        ]);

        MenuItem::create([
            'category_id' => $category2->id,
            'name' => 'پاستا آلفردو',
            'description' => 'پاستا با سس آلفردو',
            'ingredients' => 'پاستا، خامه، پنیر پارمزان، سیر',
            'price' => 110000,
            'is_available' => true,
            'order' => 2,
        ]);

        MenuItem::create([
            'category_id' => $category2->id,
            'name' => 'برگر کلاسیک',
            'description' => 'همبرگر با نان، گوشت، پنیر و سبزیجات',
            'ingredients' => 'نان همبرگر، گوشت گوساله، پنیر، کاهو، گوجه، پیاز',
            'price' => 95000,
            'is_available' => true,
            'order' => 3,
        ]);

        MenuItem::create([
            'category_id' => $category2->id,
            'name' => 'پیتزا مارگاریتا',
            'description' => 'پیتزا با پنیر موتزارلا و گوجه',
            'ingredients' => 'خمیر پیتزا، پنیر موتزارلا، گوجه، ریحان',
            'price' => 130000,
            'is_available' => true,
            'order' => 4,
        ]);

        // پیش‌غذا
        MenuItem::create([
            'category_id' => $category3->id,
            'name' => 'سالاد سزار',
            'description' => 'سالاد با سس سزار',
            'ingredients' => 'کاهو، نان تست، پنیر پارمزان، سس سزار',
            'price' => 65000,
            'is_available' => true,
            'order' => 1,
        ]);

        MenuItem::create([
            'category_id' => $category3->id,
            'name' => 'سوپ قارچ',
            'description' => 'سوپ خامه‌ای قارچ',
            'ingredients' => 'قارچ، خامه، پیاز، سیر',
            'price' => 55000,
            'is_available' => true,
            'order' => 2,
        ]);

        MenuItem::create([
            'category_id' => $category3->id,
            'name' => 'سیب‌زمینی سرخ کرده',
            'description' => 'سیب‌زمینی سرخ کرده ترد',
            'ingredients' => 'سیب‌زمینی، روغن',
            'price' => 45000,
            'is_available' => true,
            'order' => 3,
        ]);

        // دسر
        MenuItem::create([
            'category_id' => $category4->id,
            'name' => 'چیزکیک',
            'description' => 'چیزکیک کلاسیک',
            'ingredients' => 'پنیر خامه‌ای، شکر، تخم مرغ، بیسکویت',
            'price' => 75000,
            'is_available' => true,
            'order' => 1,
        ]);

        MenuItem::create([
            'category_id' => $category4->id,
            'name' => 'بستنی',
            'description' => 'بستنی وانیلی',
            'ingredients' => 'شیر، شکر، وانیل',
            'price' => 50000,
            'is_available' => true,
            'order' => 2,
        ]);

        MenuItem::create([
            'category_id' => $category4->id,
            'name' => 'کیک شکلاتی',
            'description' => 'کیک شکلاتی مرطوب',
            'ingredients' => 'شکلات، آرد، شکر، تخم مرغ',
            'price' => 80000,
            'is_available' => true,
            'order' => 3,
        ]);

        // اسنک
        MenuItem::create([
            'category_id' => $category5->id,
            'name' => 'چیپس',
            'description' => 'چیپس سیب‌زمینی',
            'ingredients' => 'سیب‌زمینی، نمک',
            'price' => 30000,
            'is_available' => true,
            'order' => 1,
        ]);

        MenuItem::create([
            'category_id' => $category5->id,
            'name' => 'پاپ کورن',
            'description' => 'پاپ کورن نمکی',
            'ingredients' => 'ذرت، روغن، نمک',
            'price' => 35000,
            'is_available' => true,
            'order' => 2,
        ]);

        MenuItem::create([
            'category_id' => $category5->id,
            'name' => 'آجیل مخلوط',
            'description' => 'مخلوط آجیل',
            'ingredients' => 'بادام، پسته، فندق',
            'price' => 60000,
            'is_available' => true,
            'order' => 3,
        ]);

        $this->command->info('Test data seeded successfully!');
        $this->command->info('Users created:');
        $this->command->info('  - Admin: admin@mafiacafe.com / password');
        $this->command->info('  - Game Master 1: gamemaster1@mafiacafe.com / password');
        $this->command->info('  - Game Master 2: gamemaster2@mafiacafe.com / password');
        $this->command->info('  - Customer 1: customer1@test.com / password');
        $this->command->info('  - Customer 2: customer2@test.com / password');
        $this->command->info('  - Customer 3: customer3@test.com / password');
        $this->command->info('Menu data created:');
        $this->command->info('  - 5 categories');
        $this->command->info('  - 18 menu items');
    }
}
