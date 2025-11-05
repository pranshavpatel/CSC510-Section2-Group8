#!/bin/bash
set -e

BASE="http://127.0.0.1:8000"
EMAIL="ppatel49@ncsu.edu"
PASS="StrongPass123!"
RID="8ac2a422-375c-4a18-a948-9d3f1e24a011"
MEAL="19054eeb-0db2-4753-94bb-b57d99fc16ca"

echo "🔐 Logging in..."
LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")

TOKEN=$(echo "$LOGIN" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("access_token",""))')
if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi
echo "✅ Logged in. Token obtained."

echo "🛍️ Creating order..."
CREATE=$(curl -s -X POST "$BASE/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"restaurant_id\":\"$RID\",\"items\":[{\"meal_id\":\"$MEAL\",\"qty\":1}]}")

OID=$(echo "$CREATE" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("id",""))')
if [ -z "$OID" ]; then
  echo "❌ Order creation failed"
  echo "$CREATE"
  exit 1
fi
echo "✅ Order created: $OID"

echo "📦 Order timeline before updates:"
curl -s "$BASE/orders/$OID/status" -H "Authorization: Bearer $TOKEN" | jq .

echo "🍳 Updating order status..."
for STATUS in accept preparing ready complete; do
  echo "➡️  $STATUS..."
  curl -s -X PATCH "$BASE/orders/$OID/$STATUS" \
    -H "Authorization: Bearer $TOKEN" | jq .
done

echo "📜 Final order status timeline:"
curl -s "$BASE/orders/$OID/status" -H "Authorization: Bearer $TOKEN" | jq .

echo "✅ Flow completed successfully."
