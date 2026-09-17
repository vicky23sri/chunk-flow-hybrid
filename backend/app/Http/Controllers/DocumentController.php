<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DocumentController extends Controller
{
    public function index()
    {
        try {
            $tenantId = tenant('id') ?? 'unknown';
            Log::info("Fetching documents list for tenant: {$tenantId}");

            $documents = Document::latest()->get();
            Log::info("Retrieved {$documents->count()} documents for tenant: {$tenantId}");

            return response()->json($documents);
        } catch (\Exception $e) {
            Log::error("Failed to fetch documents: " . $e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to retrieve documents.'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $tenantId = tenant('id') ?? 'unknown';
            Log::info("Uploading/Creating document for tenant '{$tenantId}'", ['name' => $request->name]);

            $request->validate([
                'name'       => 'required|string|max:255',
                'size_bytes' => 'nullable|integer',
            ]);

            $s3Key = 'tenant/' . $tenantId . '/data/' . $request->name;

            $document = Document::create([
                'name'       => $request->name,
                's3_key'     => $s3Key,
                'size_bytes' => $request->size_bytes ?? 0,
            ]);

            Log::info("Successfully created document ID {$document->id} ('{$document->name}') with S3 key '{$s3Key}' for tenant '{$tenantId}'");

            return response()->json($document, 201);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            Log::warning("Validation error in Document store: " . json_encode($ve->errors()));
            throw $ve;
        } catch (\Exception $e) {
            Log::error("Failed to create document record: " . $e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to store document.'], 500);
        }
    }
}
