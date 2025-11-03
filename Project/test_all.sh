#!/bin/bash
set -e

BASE_URL="http://127.0.0.1:8000"
EMAIL="ppatel49@ncsu.edu"
PASSWORD="StrongPass123!"
NAME="Pranshav Patel"

# echo "=== 1) SIGNUP ==="
# SIGNUP_RES=$(curl -s -X POST $BASE_URL/auth/signup \
#   -H "Content-Type: application/json" \
#   -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"$NAME\"}")
# echo "$SIGNUP_RES" | jq .

echo
echo "=== 2) LOGIN ==="
LOGIN_RES=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# try to pull access_token
ACCESS_TOKEN=$(echo "$LOGIN_RES" | jq -r '.access_token // empty')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Login failed. Raw response:"
  echo "$LOGIN_RES"
  echo "STOPPING here because later calls need a valid token."
  exit 1
fi

REFRESH_TOKEN=$(echo "$LOGIN_RES" | jq -r '.refresh_token // empty')

echo "$LOGIN_RES" | jq .

echo
echo "=== 3) /me ==="
curl -s -X GET $BASE_URL/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

echo
echo "=== 4) REFRESH TOKEN ==="
if [ -n "$REFRESH_TOKEN" ]; then
  curl -s -X POST $BASE_URL/auth/refresh \
    -H "Content-Type: application/json" \
    -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}" | jq .
else
  echo "no refresh_token returned from login, skipping."
fi

echo
echo "=== 5) CATALOG / RESTAURANTS ==="
curl -s -X GET $BASE_URL/catalog/restaurants \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

echo "=== /ME ==="
curl -s http://127.0.0.1:8000/me -H "Authorization: Bearer $ACCESS_TOKEN"