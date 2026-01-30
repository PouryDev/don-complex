<?php

namespace Database\Seeders;

use App\Models\CoinRewardRule;
use App\Models\FeedItem;
use App\Models\Form;
use App\Models\Quiz;
use Illuminate\Database\Seeder;

class CoinRewardRuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Default coin rewards
        $defaultRewards = [
            'quiz' => 10,
            'form' => 5,
            'reservation' => 20,
            'feed_view' => 2,
        ];

        // Create reward rules for existing quizzes
        $quizzes = Quiz::all();
        foreach ($quizzes as $quiz) {
            CoinRewardRule::firstOrCreate(
                [
                    'rewardable_type' => get_class($quiz),
                    'rewardable_id' => $quiz->id,
                ],
                [
                    'coins' => $defaultRewards['quiz'],
                    'is_active' => true,
                ]
            );
        }

        // Create reward rules for existing forms
        $forms = Form::all();
        foreach ($forms as $form) {
            CoinRewardRule::firstOrCreate(
                [
                    'rewardable_type' => get_class($form),
                    'rewardable_id' => $form->id,
                ],
                [
                    'coins' => $defaultRewards['form'],
                    'is_active' => true,
                ]
            );
        }

        // Create reward rules for existing feed items
        $feedItems = FeedItem::all();
        foreach ($feedItems as $feedItem) {
            CoinRewardRule::firstOrCreate(
                [
                    'rewardable_type' => get_class($feedItem),
                    'rewardable_id' => $feedItem->id,
                ],
                [
                    'coins' => $defaultRewards['feed_view'],
                    'is_active' => true,
                ]
            );
        }

        // Create a generic reward rule for reservations (using Reservation model)
        CoinRewardRule::firstOrCreate(
            [
                'rewardable_type' => 'App\Models\Reservation',
                'rewardable_id' => 0, // Use 0 as a special ID for generic rules
            ],
            [
                'coins' => $defaultRewards['reservation'],
                'is_active' => true,
            ]
        );
    }
}


