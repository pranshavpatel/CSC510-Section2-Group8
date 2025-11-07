# Test Commands 🧪

## Backend Tests

### Run All Tests
```bash
cd Project
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pytest tests/ -v
```

### Run with Coverage
```bash
pytest tests/ --cov=Mood2FoodRecSys --cov=app/routers --cov-report=html --cov-report=term
```

### Run Specific Test Files
```bash
pytest tests/test_recsys.py -v
pytest tests/test_routers.py -v
pytest tests/test_spotify_auth.py -v
```

### Run Specific Test
```bash
pytest tests/test_recsys.py::test_get_recommendations_success -v
```

### Run Performance Tests
```bash
pytest tests/test_performance.py -v -s
```

### Run Security Tests
```bash
pytest tests/test_security.py -v -s
```

### Generate Coverage Report
```bash
pytest tests/ --cov=Mood2FoodRecSys --cov=app/routers --cov-report=xml --cov-report=term
```

### View HTML Coverage Report
```bash
pytest tests/ --cov=Mood2FoodRecSys --cov=app/routers --cov-report=html
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

### Run Tests with Markers
```bash
# Run only integration tests
pytest tests/ -m integration -v

# Run only unit tests
pytest tests/ -m unit -v

# Skip slow tests
pytest tests/ -m "not slow" -v
```

### Run Tests in Parallel
```bash
pip install pytest-xdist
pytest tests/ -n auto
```

### Stop on First Failure
```bash
pytest tests/ -x
```

### Show Print Statements
```bash
pytest tests/ -s
```

### Verbose Output
```bash
pytest tests/ -vv
```

---

## Frontend Tests

### Run All Tests
```bash
cd Project/client
npm test
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Run in Watch Mode
```bash
npm test -- --watch
```

### Run Specific Test File
```bash
npm test -- __tests__/app/login/page.test.tsx
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should render"
```

### Update Snapshots
```bash
npm test -- -u
```

### Run with Coverage and Generate Report
```bash
npm test -- --coverage --coverageReporters=lcov --coverageReporters=html
```

### View HTML Coverage Report
```bash
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
start coverage/lcov-report/index.html  # Windows
```

### Run Tests Without Cache
```bash
npm test -- --no-cache
```

### Debug Tests
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## Linting

### Backend Linting
```bash
cd Project
flake8 app/ Mood2FoodRecSys/ --max-line-length=120
```

### Frontend Linting
```bash
cd Project/client
npm run lint
```

### Fix Linting Issues
```bash
npm run lint -- --fix
```

---

## Type Checking

### Frontend Type Check
```bash
cd Project/client
npx tsc --noEmit
```

---

## Integration Tests

### Run Full Integration Suite
```bash
cd Project
pytest tests/test_integration.py -v -s
```

### Test API Endpoints
```bash
# Start backend first
uvicorn app.main:app --reload

# In another terminal
cd Project
pytest tests/test_routers.py -v
```

---

## CI/CD Test Commands

### Backend CI Tests
```bash
cd Project
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest tests/ --cov=Mood2FoodRecSys --cov=app/routers --cov-report=xml --cov-report=term
```

### Frontend CI Tests
```bash
cd Project/client
npm ci
npm test -- --coverage --coverageReporters=lcov --watchAll=false
```

---

## Test Coverage Thresholds

### Backend
- Statements: 70%
- Functions: 70%
- Lines: 70%

### Frontend
- Statements: 70%
- Functions: 70%
- Lines: 70%

---

## Common Test Scenarios

### Test Authentication
```bash
pytest tests/test_routers.py::test_signup_success -v
pytest tests/test_routers.py::test_login_success -v
```

### Test Recommendations
```bash
pytest tests/test_recsys.py::test_get_recommendations_success -v
pytest tests/test_recsys_functions.py -v
```

### Test Cart & Orders
```bash
pytest tests/test_routers.py::test_add_to_cart -v
pytest tests/test_routers.py::test_create_order -v
```

### Test Owner Features
```bash
pytest tests/test_owner_meals.py -v
```

---

## Debugging Tests

### Run Single Test with Debug Output
```bash
pytest tests/test_recsys.py::test_get_recommendations_success -vv -s
```

### Use Python Debugger
```python
# Add to test file
import pdb; pdb.set_trace()
```

```bash
pytest tests/test_recsys.py -s
```

### Print Test Output
```bash
pytest tests/ -v --capture=no
```

---

## Mock Data Testing

### Test with Mock Spotify Data
```bash
pytest tests/test_spotify_auth.py -v
```

### Test with Mock Database
```bash
pytest tests/test_recsys_functions.py -v
```

---

## Performance Testing

### Measure Test Execution Time
```bash
pytest tests/ --durations=10
```

### Profile Tests
```bash
pip install pytest-profiling
pytest tests/ --profile
```

---

## Test Environment Setup

### Set Test Environment Variables
```bash
export DATABASE_URL=postgresql://test:test@localhost:5432/test
export SUPABASE_URL=https://test.supabase.co
export SUPABASE_JWT_SECRET=test-secret
export SUPABASE_ANON_KEY=test-anon-key
```

### Windows
```cmd
set DATABASE_URL=postgresql://test:test@localhost:5432/test
set SUPABASE_URL=https://test.supabase.co
```

---

## Continuous Testing

### Watch Backend Tests
```bash
pip install pytest-watch
ptw tests/
```

### Watch Frontend Tests
```bash
npm test -- --watch
```

---

## Test Reports

### Generate JUnit XML Report
```bash
pytest tests/ --junitxml=test-results.xml
```

### Generate JSON Report
```bash
pip install pytest-json-report
pytest tests/ --json-report --json-report-file=report.json
```

---

## Quick Test Commands

### Full Test Suite (Backend + Frontend)
```bash
# Backend
cd Project && pytest tests/ --cov=Mood2FoodRecSys --cov=app/routers --cov-report=term

# Frontend
cd Project/client && npm test -- --coverage --watchAll=false
```

### Fast Tests Only
```bash
pytest tests/ -m "not slow" -v
```

### Critical Tests Only
```bash
pytest tests/test_routers.py tests/test_recsys.py -v
```

---

## Troubleshooting Tests

### Clear Test Cache
```bash
# Backend
pytest --cache-clear

# Frontend
npm test -- --clearCache
```

### Reinstall Dependencies
```bash
# Backend
pip install -r requirements.txt --force-reinstall

# Frontend
rm -rf node_modules package-lock.json
npm install
```

### Check Test Configuration
```bash
# Backend
pytest --collect-only

# Frontend
npm test -- --listTests
```

---

## Test Statistics

### Current Coverage
- **Backend:** 84% (191 tests)
- **Frontend:** 74.78% (369 tests)
- **Total:** 560 tests

### Test Execution Time
- Backend: ~8 seconds
- Frontend: ~6 seconds
- Total: ~14 seconds

---

## Best Practices

1. **Run tests before committing**
   ```bash
   pytest tests/ -v && cd client && npm test -- --watchAll=false
   ```

2. **Check coverage before PR**
   ```bash
   pytest tests/ --cov=Mood2FoodRecSys --cov=app/routers --cov-report=term
   ```

3. **Run linting with tests**
   ```bash
   flake8 && pytest tests/
   ```

4. **Use descriptive test names**
   ```python
   def test_user_can_add_item_to_cart_successfully():
       pass
   ```

5. **Keep tests isolated**
   - Use fixtures
   - Mock external dependencies
   - Clean up after tests

---

## CI/CD Integration

Tests run automatically on:
- Push to `main` branch
- Pull requests to `main`
- Manual workflow dispatch

View results: [GitHub Actions](https://github.com/pranshavpatel/CSC510-Section2-Group8/actions)

---

## Support

**Issues with tests?**
1. Check test logs
2. Verify environment variables
3. Clear cache and retry
4. Open issue on GitHub

**Need help?** Join Discord: https://discord.gg/u73Dqj5dsV
