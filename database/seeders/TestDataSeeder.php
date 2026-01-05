<?php

namespace Database\Seeders;

use App\Enums\PaymentStatus;
use App\Enums\SessionStatus;
use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Hall;
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

        // Game masters will be created after branches, so we'll update them later
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
        ]);

        $branch2 = Branch::create([
            'name' => 'شعبه شمال',
            'address' => 'تهران، میدان ونک، خیابان ونک',
        ]);

        $branch3 = Branch::create([
            'name' => 'شعبه جنوب',
            'address' => 'تهران، میدان انقلاب، خیابان انقلاب',
        ]);

        // Assign game masters to branches
        $gameMaster1->update(['branch_id' => $branch1->id]);
        $gameMaster2->update(['branch_id' => $branch2->id]);

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

        // Note: Menu data (categories and menu items) are created by MenuSeeder
        // Run: php artisan db:seed --class=MenuSeeder

        $this->command->info('Test data seeded successfully!');
        $this->command->info('Users created:');
        $this->command->info('  - Admin: admin@mafiacafe.com / password');
        $this->command->info('  - Game Master 1: gamemaster1@mafiacafe.com / password');
        $this->command->info('  - Game Master 2: gamemaster2@mafiacafe.com / password');
        $this->command->info('  - Customer 1: customer1@test.com / password');
        $this->command->info('  - Customer 2: customer2@test.com / password');
        $this->command->info('  - Customer 3: customer3@test.com / password');
        $this->command->info('');
        $this->command->info('Note: To seed menu data, run: php artisan db:seed --class=MenuSeeder');
    }
}
