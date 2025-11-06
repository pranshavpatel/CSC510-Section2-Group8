# Frontend Tests - Profile & Logout

## Test Files

### 1. `profile.test.tsx` - Profile Page Tests
Tests for the customer profile page functionality.

#### Test Coverage:
- ✅ **Authentication** (2 tests)
  - Redirects to login if not authenticated
  - Renders profile page when authenticated

- ✅ **Profile Display** (4 tests)
  - Displays user email (read-only)
  - Displays user name (editable)
  - Displays user role (read-only)
  - Shows loading state

- ✅ **Update Profile** (3 tests)
  - Updates user name successfully
  - Shows error on update failure
  - Disables save button while saving

- ✅ **Delete Account** (3 tests)
  - Shows confirmation dialog
  - Deletes account and logs out
  - Shows error on delete failure

- ✅ **Error Handling** (1 test)
  - Displays error when profile fetch fails

**Total: 13 tests**

### 2. `logout.test.tsx` - Logout Functionality Tests
Tests for logout button and API integration.

#### Test Coverage:
- ✅ **Logout Button** (3 tests)
  - Renders when authenticated
  - Does not render when not authenticated
  - Calls logout function when clicked

- ✅ **Logout API Integration** (4 tests)
  - Calls logout API with access token
  - Handles API success
  - Handles API failure gracefully
  - Clears local storage on logout

- ✅ **User Display** (2 tests)
  - Displays user name when authenticated
  - Displays profile link when authenticated

- ✅ **Navigation After Logout** (1 test)
  - Shows login button after logout

- ✅ **Error Scenarios** (2 tests)
  - Handles logout when no access token exists
  - Continues logout even if API call fails

**Total: 12 tests**

## Running Tests

### Run All Tests
```bash
cd client
npm test
```

### Run Specific Test File
```bash
npm test profile.test.tsx
npm test logout.test.tsx
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Run in Watch Mode
```bash
npm test -- --watch
```

## Test Summary

- **Total Tests**: 25
- **Profile Tests**: 13
- **Logout Tests**: 12

## What's Tested

### Profile Page
- ✅ Authentication checks
- ✅ Profile data display
- ✅ Name update functionality
- ✅ Account deletion with confirmation
- ✅ Loading states
- ✅ Error handling
- ✅ Form validation

### Logout
- ✅ Logout button visibility
- ✅ API integration
- ✅ Token management
- ✅ Local storage cleanup
- ✅ Navigation after logout
- ✅ Error scenarios

## API Endpoints Tested

### Profile
- `GET /me` - Fetch profile
- `PATCH /me` - Update profile
- `DELETE /auth/me` - Delete account

### Logout
- `POST /auth/logout` - Logout user

## Mocked Dependencies

- `next/navigation` - Router and pathname
- `@/context/auth-context` - Auth context
- `@/lib/api` - API functions

## Expected Results

All 25 tests should pass:
```
PASS  __tests__/profile.test.tsx (13 tests)
PASS  __tests__/logout.test.tsx (12 tests)

Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
```
