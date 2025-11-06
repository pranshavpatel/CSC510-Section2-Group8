#!/usr/bin/env python3
"""Database migration helper script"""
import sys
import subprocess

def run_command(cmd):
    """Run shell command and return result"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    return result.returncode

def main():
    if len(sys.argv) < 2:
        print("""
Database Migration Helper

Usage:
  python migrate.py upgrade          # Apply all pending migrations
  python migrate.py downgrade        # Rollback one migration
  python migrate.py create <message> # Create new migration
  python migrate.py current          # Show current version
  python migrate.py history          # Show migration history
  python migrate.py reset            # Reset to base (WARNING: removes all data)
        """)
        sys.exit(1)

    command = sys.argv[1]

    if command == "upgrade":
        print("Applying migrations...")
        return run_command("alembic upgrade head")
    
    elif command == "downgrade":
        print("Rolling back one migration...")
        return run_command("alembic downgrade -1")
    
    elif command == "create":
        if len(sys.argv) < 3:
            print("Error: Please provide a migration message")
            sys.exit(1)
        message = " ".join(sys.argv[2:])
        print(f"Creating migration: {message}")
        return run_command(f'alembic revision --autogenerate -m "{message}"')
    
    elif command == "current":
        return run_command("alembic current")
    
    elif command == "history":
        return run_command("alembic history --verbose")
    
    elif command == "reset":
        confirm = input("WARNING: This will remove all data. Type 'yes' to confirm: ")
        if confirm.lower() == "yes":
            print("Resetting database...")
            return run_command("alembic downgrade base")
        else:
            print("Cancelled")
            return 0
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    sys.exit(main())
