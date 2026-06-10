<?php
/**
 * Formula Verification Test
 * 
 * This script demonstrates the rapor formula calculation
 * Formula: (Sem1 + 2*Sem2) / 3
 */

echo "=== Rapor Formula Verification ===\n\n";

// Test Case 1: Student with both Sem1 and Sem2 grades
echo "Test Case 1: Both Sem1 and Sem2\n";
$sem1 = 80;
$sem2 = 90;
$rapor = round(($sem1 + (2 * $sem2)) / 3);
echo "Sem1: $sem1, Sem2: $sem2\n";
echo "Formula: ($sem1 + (2 * $sem2)) / 3\n";
echo "Calculation: ($sem1 + " . (2 * $sem2) . ") / 3 = " . ($sem1 + (2 * $sem2)) . " / 3\n";
echo "Result: $rapor\n";
echo "Expected: 87 (rounded from 86.67)\n";
echo "Status: " . ($rapor == 87 ? "✅ PASS" : "❌ FAIL") . "\n\n";

// Test Case 2: Student with only Sem2 (no Sem1 data)
echo "Test Case 2: Only Sem2 (no Sem1)\n";
$sem1 = 0;
$sem2 = 85;
if ($sem1 > 0) {
    $rapor = round(($sem1 + (2 * $sem2)) / 3);
} else {
    $rapor = $sem2;
}
echo "Sem1: $sem1 (no data), Sem2: $sem2\n";
echo "Logic: If no Sem1, use Sem2 only\n";
echo "Result: $rapor\n";
echo "Expected: 85\n";
echo "Status: " . ($rapor == 85 ? "✅ PASS" : "❌ FAIL") . "\n\n";

// Test Case 3: Different score combinations
echo "Test Case 3: Various Score Combinations\n";
$testCases = [
    ['sem1' => 70, 'sem2' => 80, 'expected' => 77],  // (70 + 160) / 3 = 76.67 → 77
    ['sem1' => 85, 'sem2' => 85, 'expected' => 85],  // (85 + 170) / 3 = 85
    ['sem1' => 75, 'sem2' => 90, 'expected' => 85],  // (75 + 180) / 3 = 85
    ['sem1' => 90, 'sem2' => 75, 'expected' => 80],  // (90 + 150) / 3 = 80
];

foreach ($testCases as $i => $test) {
    $sem1 = $test['sem1'];
    $sem2 = $test['sem2'];
    $expected = $test['expected'];
    $rapor = round(($sem1 + (2 * $sem2)) / 3);
    $status = ($rapor == $expected) ? "✅ PASS" : "❌ FAIL";
    echo "  Case " . ($i + 1) . ": Sem1=$sem1, Sem2=$sem2 → Rapor=$rapor (expected: $expected) $status\n";
}

echo "\n=== Verification Complete ===\n";
echo "All test cases demonstrate the correct formula implementation.\n";
echo "Formula: (Sem1 + 2*Sem2) / 3\n";
echo "Edge case: If Sem1 = 0, use Sem2 only\n";
