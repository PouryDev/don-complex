<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSessionTemplateRequest;
use App\Http\Resources\SessionTemplateResource;
use App\Models\Hall;
use App\Models\SessionTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SessionTemplateController extends Controller
{
    public function index(Request $request, Hall $hall): AnonymousResourceCollection
    {
        $this->authorize('update', $hall->branch);

        $templates = $hall->sessionTemplates;

        return SessionTemplateResource::collection($templates);
    }

    public function store(StoreSessionTemplateRequest $request, Hall $hall): SessionTemplateResource
    {
        $this->authorize('update', $hall->branch);

        $template = $hall->sessionTemplates()->create($request->validated());
        $template->load('hall');

        return new SessionTemplateResource($template);
    }

    public function update(StoreSessionTemplateRequest $request, SessionTemplate $sessionTemplate): SessionTemplateResource
    {
        $this->authorize('update', $sessionTemplate->hall->branch);

        $sessionTemplate->update($request->validated());
        $sessionTemplate->load('hall');

        return new SessionTemplateResource($sessionTemplate);
    }

    public function destroy(SessionTemplate $sessionTemplate)
    {
        $this->authorize('update', $sessionTemplate->hall->branch);

        $sessionTemplate->delete();

        return response()->json(['message' => 'Session template deleted successfully']);
    }
}

