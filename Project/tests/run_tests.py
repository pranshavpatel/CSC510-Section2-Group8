#!/usr/bin/env python3
"""
Test runner script for Mood2FoodRecSys unit tests
"""

import subprocess
import sys
import pathlib

def run_tests():
    """Run all unit tests with coverage reporting"""
    test_dir = pathlib.Path(__file__).parent
    project_root = test_dir.parent
    
    # Change to project root directory
    import os
    os.chdir(project_root)
    
    # Run pytest with coverage
    cmd = [
        sys.executable, "-m", "pytest",
        "tests/",
        "-v",
        "--tb=short",
        "--durations=10"
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        return result.returncode
    except Exception as e:
        print(f"Error running tests: {e}")
        return 1

if __name__ == "__main__":
    exit_code = run_tests()
    sys.exit(exit_code)