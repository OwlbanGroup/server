import os
import sys
import subprocess

# Add root project directory to PYTHONPATH to resolve data_generator imports
root_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, root_dir)
os.environ['PYTHONPATH'] = os.pathsep.join(sys.path)

# Run pytest on benchmarks directory with no config file to avoid --mypy arg issues
result = subprocess.run(['pytest', 'benchmarks/', '-c', 'none', '--maxfail=1', '--disable-warnings', '-q'], capture_output=True, text=True)

print(result.stdout)
print(result.stderr)

if result.returncode != 0:
    print(f"Tests failed with exit code {result.returncode}")
    sys.exit(result.returncode)
