<?php

namespace Database\Seeders;

use App\Models\News;
use App\Models\Form;
use App\Models\Quiz;
use App\Models\FeedItem;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class FeedSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create News items
        $news1 = News::create([
            'title' => 'افتتاحیه جدید',
            'description' => 'ما با افتخار اعلام می‌کنیم که شعبه جدید ما در مرکز شهر افتتاح شده است.',
            'badge' => 'خبر ویژه',
            'image_url' => null,
        ]);

        $news2 = News::create([
            'title' => 'برنامه جدید هفتگی',
            'description' => 'برنامه جدید بازی‌های هفتگی ما اکنون در دسترس است. برای رزرو وقت اقدام کنید.',
            'badge' => 'اطلاعیه',
            'image_url' => null,
        ]);

        $news3 = News::create([
            'title' => 'تخفیف ویژه آخر هفته',
            'description' => 'از جمعه تا یکشنبه از تخفیف ۲۰ درصدی بهره‌مند شوید.',
            'badge' => 'پیشنهاد ویژه',
            'image_url' => null,
        ]);

        // Create Forms
        $form1 = Form::create([
            'title' => 'فرم ثبت‌نام رویداد',
            'description' => 'برای شرکت در رویداد ویژه ما، لطفاً این فرم را تکمیل کنید.',
            'badge' => 'فرم',
            'fields' => [
                [
                    'type' => 'text',
                    'name' => 'name',
                    'label' => 'نام و نام خانوادگی',
                    'required' => true,
                ],
                [
                    'type' => 'email',
                    'name' => 'email',
                    'label' => 'ایمیل',
                    'required' => true,
                ],
                [
                    'type' => 'tel',
                    'name' => 'phone',
                    'label' => 'شماره تماس',
                    'required' => true,
                ],
            ],
        ]);

        $form2 = Form::create([
            'title' => 'فرم نظرسنجی',
            'description' => 'نظرات شما برای ما ارزشمند است. لطفاً این فرم را تکمیل کنید.',
            'badge' => 'نظرسنجی',
            'fields' => [
                [
                    'type' => 'textarea',
                    'name' => 'feedback',
                    'label' => 'نظرات شما',
                    'required' => false,
                ],
                [
                    'type' => 'select',
                    'name' => 'rating',
                    'label' => 'امتیاز',
                    'options' => ['عالی', 'خوب', 'متوسط', 'ضعیف'],
                    'required' => true,
                ],
            ],
        ]);

        // Create Quizzes
        $quiz1 = Quiz::create([
            'title' => 'کوئیز مافیا',
            'description' => 'آزمون دانش شما درباره بازی مافیا. ببینید چقدر در این بازی مهارت دارید!',
            'badge' => 'کوئیز',
            'questions' => [
                [
                    'question' => 'نقش شهروند در بازی مافیا چیست؟',
                    'options' => [
                        'کشتن مافیا',
                        'پیدا کردن مافیا',
                        'زنده ماندن تا آخر بازی',
                        'همه موارد',
                    ],
                    'correct_answer' => 2,
                ],
                [
                    'question' => 'نقش مافیا در شب چه کاری انجام می‌دهد؟',
                    'options' => [
                        'رای دادن',
                        'کشتن یک نفر',
                        'محافظت از خود',
                        'هیچ کاری',
                    ],
                    'correct_answer' => 1,
                ],
            ],
        ]);

        $quiz2 = Quiz::create([
            'title' => 'کوئیز قوانین بازی',
            'description' => 'آزمون قوانین و مقررات بازی. چقدر با قوانین آشنا هستید؟',
            'badge' => 'آزمون',
            'questions' => [
                [
                    'question' => 'در بازی مافیا، چند نفر باید رای دهند تا یک نفر حذف شود؟',
                    'options' => [
                        'اکثریت',
                        'همه',
                        'نصف',
                        'یک نفر',
                    ],
                    'correct_answer' => 0,
                ],
            ],
        ]);

        // Create Feed Items - Link all entities to feed_items table
        $order = 1;

        // News feed items
        FeedItem::create([
            'feedable_type' => News::class,
            'feedable_id' => $news1->id,
            'scheduled_at' => Carbon::now()->subDays(2),
            'is_active' => true,
            'order' => $order++,
        ]);

        FeedItem::create([
            'feedable_type' => News::class,
            'feedable_id' => $news2->id,
            'scheduled_at' => Carbon::now()->subDay(),
            'is_active' => true,
            'order' => $order++,
        ]);

        FeedItem::create([
            'feedable_type' => News::class,
            'feedable_id' => $news3->id,
            'scheduled_at' => Carbon::now(),
            'is_active' => true,
            'order' => $order++,
        ]);

        // Form feed items
        FeedItem::create([
            'feedable_type' => Form::class,
            'feedable_id' => $form1->id,
            'scheduled_at' => Carbon::now()->subDays(3),
            'is_active' => true,
            'order' => $order++,
        ]);

        FeedItem::create([
            'feedable_type' => Form::class,
            'feedable_id' => $form2->id,
            'scheduled_at' => Carbon::now()->subHours(12),
            'is_active' => true,
            'order' => $order++,
        ]);

        // Quiz feed items
        FeedItem::create([
            'feedable_type' => Quiz::class,
            'feedable_id' => $quiz1->id,
            'scheduled_at' => Carbon::now()->subDays(1),
            'is_active' => true,
            'order' => $order++,
        ]);

        FeedItem::create([
            'feedable_type' => Quiz::class,
            'feedable_id' => $quiz2->id,
            'scheduled_at' => Carbon::now()->subHours(6),
            'is_active' => true,
            'order' => $order++,
        ]);

        $this->command->info('Feed data seeded successfully!');
        $this->command->info('  - ' . News::count() . ' news items');
        $this->command->info('  - ' . Form::count() . ' forms');
        $this->command->info('  - ' . Quiz::count() . ' quizzes');
        $this->command->info('  - ' . FeedItem::count() . ' feed items');
    }
}
