# Customer Profile Page

## Overview
Customer profile page that allows users to view, update, and delete their account information.

## Features

### ✅ View Profile
- Display user email (read-only)
- Display user name (editable)
- Display user role (read-only)

### ✅ Update Profile
- Edit and save name
- Real-time validation
- Success/error notifications

### ✅ Delete Account
- Confirmation dialog before deletion
- Permanently removes account
- Logs out and redirects to home

## API Endpoints Used

### GET /me
- Fetches current user profile
- Returns: `{ id, email, name, role }`

### PATCH /me
- Updates user profile
- Body: `{ name?: string }`
- Returns: Updated profile

### DELETE /auth/me
- Deletes user account permanently
- Returns: Deletion confirmation

## Components Used

- `Card` - Profile information container
- `Input` - Form fields
- `Button` - Actions
- `Label` - Field labels
- `AlertDialog` - Delete confirmation
- Icons from `lucide-react`

## Usage

Navigate to `/profile` when logged in.

## Security

- Requires authentication
- Redirects to login if not authenticated
- Email cannot be changed (security)
- Delete requires confirmation dialog

## File Location

`client/app/profile/page.tsx`
