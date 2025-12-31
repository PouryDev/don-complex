<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Category;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all branches
        $branches = Branch::all();

        if ($branches->isEmpty()) {
            $this->command->warn('No branches found. Please run TestDataSeeder first to create branches.');
            return;
        }

        foreach ($branches as $branch) {
            $this->command->info("Creating menu for branch: {$branch->name}");

            // Create Categories for this branch
            $category1 = Category::firstOrCreate(
                ['name' => 'نوشیدنی‌ها', 'branch_id' => $branch->id],
                ['order' => 1, 'is_active' => true]
            );

            $category2 = Category::firstOrCreate(
                ['name' => 'غذاهای اصلی', 'branch_id' => $branch->id],
                ['order' => 2, 'is_active' => true]
            );

            $category3 = Category::firstOrCreate(
                ['name' => 'پیش‌غذا', 'branch_id' => $branch->id],
                ['order' => 3, 'is_active' => true]
            );

            $category4 = Category::firstOrCreate(
                ['name' => 'دسر', 'branch_id' => $branch->id],
                ['order' => 4, 'is_active' => true]
            );

            $category5 = Category::firstOrCreate(
                ['name' => 'اسنک', 'branch_id' => $branch->id],
                ['order' => 5, 'is_active' => true]
            );

            // Create Menu Items for this branch
            // نوشیدنی‌ها
            MenuItem::firstOrCreate(
                ['name' => 'قهوه اسپرسو', 'category_id' => $category1->id, 'branch_id' => $branch->id],
                [
                    'description' => 'قهوه اسپرسو تازه دم شده',
                    'ingredients' => 'دانه قهوه، آب',
                    'price' => 25000,
                    'is_available' => true,
                    'order' => 1,
                ]
            );

            MenuItem::firstOrCreate(
                ['name' => 'کاپوچینو', 'category_id' => $category1->id, 'branch_id' => $branch->id],
                [
                    'description' => 'قهوه با شیر و فوم',
                    'ingredients' => 'اسپرسو، شیر، فوم شیر',
                    'price' => 35000,
                    'is_available' => true,
                    'order' => 2,
                ]
            );

            MenuItem::firstOrCreate(
                ['name' => 'لاته', 'category_id' => $category1->id, 'branch_id' => $branch->id],
                [
                    'description' => 'قهوه با شیر',
                    'ingredients' => 'اسپرسو، شیر',
                    'price' => 32000,
                    'is_available' => true,
                    'order' => 3,
                ]
            );

            MenuItem::firstOrCreate(
                ['name' => 'آبمیوه طبیعی', 'category_id' => $category1->id, 'branch_id' => $branch->id],
                [
                    'description' => 'آبمیوه تازه فشرده شده',
                    'ingredients' => 'میوه تازه',
                    'price' => 40000,
                    'is_available' => true,
                    'order' => 4,
                ]
            );

            MenuItem::firstOrCreate(
                ['name' => 'چای', 'category_id' => $category1->id, 'branch_id' => $branch->id],
                [
                    'description' => 'چای ایرانی',
                    'ingredients' => 'برگ چای، آب',
                    'price' => 15000,
                    'is_available' => true,
                    'order' => 5,
                ]
            );

            // غذاهای اصلی
            MenuItem::firstOrCreate(
                ['name' => 'پاستا کاربونارا', 'category_id' => $category2->id, 'branch_id' => $branch->id],
                [
                    'description' => 'پاستا با سس خامه و بیکن',
                    'ingredients' => 'پاستا، خامه، بیکن، پنیر پارمزان',
                    'price' => 120000,
                    'is_available' => true,
                    'order' => 1,
                ]
            );

            MenuItem::firstOrCreate(
                ['name' => 'پاستا آلفردو', 'category_id' => $category2->id, 'branch_id' => $branch->id],
                [
                    'description' => 'پاستا با سس آلفردو',
                    'ingredients' => 'پاستا، خامه، پنیر پارمزان، سیر',
                    'price' => 110000,
                    'is_available' => true,
                    'order' => 2,
                ]
            );

            MenuItem::firstOrCreate(
                ['name' => 'برگر کلاسیک', 'category_id' => $category2->id, 'branch_id' => $branch->id],
                [
                    'description' => 'همبرگر با نان، گوشت، پنیر و سبزیجات',
                    'ingredients' => 'نان همبرگر، گوشت گوساله، پنیر، کاهو، گوجه، پیاز',
                    'price' => 95000,
                    'is_available' => true,
                    'order' => 3,
                ]
            );

            MenuItem::firstOrCreate(
                ['name' => 'پیتزا مارگاریتا', 'category_id' => $category2->id, 'branch_id' => $branch->id],
                [
                    'description' => 'پیتزا با پنیر موتزارلا و گوجه',
                    'ingredients' => 'خمیر پیتزا، پنیر موتزارلا، گوجه، ریحان',
                    'price' => 130000,
                    'is_available' => true,
                    'order' => 4,
                ]
            );

            // پیش‌غذا
            MenuItem::firstOrCreate(
                ['name' => 'سالاد سزار', 'category_id' => $category3->id, 'branch_id' => $branch->id],
                [
                    'description' => 'سالاد با سس سزار',
                    'ingredients' => 'کاهو، نان تست، پنیر پارمزان، سس سزار',
                    'price' => 65000,
                    'is_available' => true,
                    'order' => 1,
                ]
            );

            MenuItem::firstOrCreate(
                ['name' => 'سوپ قارچ', 'category_id' => $category3->id, 'branch_id' => $branch->id],
                [
                    'description' => 'سوپ خامه‌ای قارچ',
                    'ingredients' => 'قارچ، خامه، پیاز، سیر',
                    'price' => 55000,
                    'is_available' => true,
                    'order' => 2,
                ]
            );

            MenuItem::firstOrCreate(
                ['name' => 'سیب‌زمینی سرخ کرده', 'category_id' => $category3->id, 'branch_id' => $branch->id],
                [
                    'description' => 'سیب‌زمینی سرخ کرده ترد',
                    'ingredients' => 'سیب‌زمینی، روغن',
                    'price' => 45000,
                    'is_available' => true,
                    'order' => 3,
                ]
            );

            // دسر
            MenuItem::firstOrCreate(
                ['name' => 'چیزکیک', 'category_id' => $category4->id, 'branch_id' => $branch->id],
                [
                    'description' => 'چیزکیک کلاسیک',
                    'ingredients' => 'پنیر خامه‌ای، شکر، تخم مرغ، بیسکویت',
                    'price' => 75000,
                    'is_available' => true,
                    'order' => 1,
                ]
            );

            MenuItem::firstOrCreate(
                ['name' => 'بستنی', 'category_id' => $category4->id, 'branch_id' => $branch->id],
                [
                    'description' => 'بستنی وانیلی',
                    'ingredients' => 'شیر، شکر، وانیل',
                    'price' => 50000,
                    'is_available' => true,
                    'order' => 2,
                ]
            );

            MenuItem::firstOrCreate(
                ['name' => 'کیک شکلاتی', 'category_id' => $category4->id, 'branch_id' => $branch->id],
                [
                    'description' => 'کیک شکلاتی مرطوب',
                    'ingredients' => 'شکلات، آرد، شکر، تخم مرغ',
                    'price' => 80000,
                    'is_available' => true,
                    'order' => 3,
                ]
            );

            // اسنک
            MenuItem::firstOrCreate(
                ['name' => 'چیپس', 'category_id' => $category5->id, 'branch_id' => $branch->id],
                [
                    'description' => 'چیپس سیب‌زمینی',
                    'ingredients' => 'سیب‌زمینی، نمک',
                    'price' => 30000,
                    'is_available' => true,
                    'order' => 1,
                ]
            );

            MenuItem::firstOrCreate(
                ['name' => 'پاپ کورن', 'category_id' => $category5->id, 'branch_id' => $branch->id],
                [
                    'description' => 'پاپ کورن نمکی',
                    'ingredients' => 'ذرت، روغن، نمک',
                    'price' => 35000,
                    'is_available' => true,
                    'order' => 2,
                ]
            );

            MenuItem::firstOrCreate(
                ['name' => 'آجیل مخلوط', 'category_id' => $category5->id, 'branch_id' => $branch->id],
                [
                    'description' => 'مخلوط آجیل',
                    'ingredients' => 'بادام، پسته، فندق',
                    'price' => 60000,
                    'is_available' => true,
                    'order' => 3,
                ]
            );
        }

        $this->command->info('Menu data seeded successfully!');
        $this->command->info("  - {$branches->count()} branches");
        $this->command->info('  - 5 categories per branch');
        $this->command->info('  - 18 menu items per branch');
    }
}
