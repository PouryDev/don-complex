<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'menu_item_id' => $this->menu_item_id,
            'quantity' => $this->quantity,
            'price' => (float) $this->price,
            'subtotal' => (float) $this->subtotal,
            'menu_item' => $this->whenLoaded('menuItem', function () {
                return [
                    'id' => $this->menuItem->id,
                    'name' => $this->menuItem->name,
                    'description' => $this->menuItem->description,
                    'image' => $this->menuItem->image ? asset('storage/' . $this->menuItem->image) : null,
                    'category' => $this->whenLoaded('menuItem.category', function () {
                        return [
                            'id' => $this->menuItem->category->id,
                            'name' => $this->menuItem->category->name,
                        ];
                    }),
                ];
            }),
        ];
    }
}

