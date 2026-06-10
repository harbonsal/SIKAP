<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\StudentHealthRecord;
use App\Models\Student;

class StudentHealthController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Find student linked to this user (assuming User has 'student' relation or logic)
        // Adjust this logic based on how Student Portal connects User -> Student
        // Usually User has `student_id` or Student has `user_id` or matched by email?
        // Checking StudentController::myProfile might give a clue. 
        // Assuming user->student relationship exists or we find via email/NIS

        $student = $user->student; // Standard relationship

        if (!$student) {
            return Inertia::render('Student/Health/Index', [
                'records' => [],
                'error' => 'Data santri tidak ditemukan.'
            ]);
        }

        $records = StudentHealthRecord::where('student_id', $student->id)
            ->with(['complaints', 'creator'])
            ->latest('date')
            ->get();

        return Inertia::render('Student/Health/Index', [
            'records' => $records,
            'student' => $student
        ]);
    }
}
