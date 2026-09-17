<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProjectController extends Controller
{
    public function index()
    {
        try {
            $tenantId = tenant('id') ?? 'unknown';
            Log::info("Fetching all projects for tenant: {$tenantId}");

            $projects = Project::latest()->get();
            Log::info("Retrieved {$projects->count()} projects for tenant: {$tenantId}");

            return response()->json($projects);
        } catch (\Exception $e) {
            Log::error("Failed to fetch projects: " . $e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to retrieve projects.'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $tenantId = tenant('id') ?? 'unknown';
            Log::info("Creating new project for tenant '{$tenantId}'", ['name' => $request->name]);

            $request->validate([
                'name'        => 'required|string|max:255',
                'description' => 'nullable|string',
            ]);

            $project = Project::create([
                'name'        => $request->name,
                'description' => $request->description ?? '',
                'status'      => 'active',
            ]);

            Log::info("Successfully created project ID {$project->id} ('{$project->name}') for tenant '{$tenantId}'");

            return response()->json($project, 201);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            Log::warning("Validation error in Project store: " . json_encode($ve->errors()));
            throw $ve;
        } catch (\Exception $e) {
            Log::error("Failed to create project: " . $e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to create project.'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $tenantId = tenant('id') ?? 'unknown';
            Log::info("Deleting project ID {$id} for tenant '{$tenantId}'");

            $project = Project::findOrFail($id);
            $projectName = $project->name;
            $project->delete();

            Log::info("Successfully deleted project ID {$id} ('{$projectName}') for tenant '{$tenantId}'");

            return response()->json(['message' => 'Project deleted']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning("Project delete failed: Project ID {$id} not found.");
            return response()->json(['error' => 'Project not found'], 404);
        } catch (\Exception $e) {
            Log::error("Failed to delete project ID {$id}: " . $e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to delete project.'], 500);
        }
    }
}
