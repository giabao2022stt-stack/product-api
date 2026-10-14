#!/usr/bin/env bash
# Kiem tra CRUD cua product-api. Cach dung: bash scripts/test-crud.sh [BASE_URL]
set -uo pipefail

BASE="${1:-http://localhost:3000}"
JSON='Content-Type: application/json'
PID=$(( (RANDOM % 9000) + 1000 ))

http() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

check() {
  if [ "$2" = "$3" ]; then echo "OK   : $1"; else echo "FAIL : $1 (mong doi $2, nhan $3)"; exit 1; fi
}

contains() {
  if echo "$3" | grep -q "$2"; then echo "OK   : $1"; else echo "FAIL : $1"; exit 1; fi
}

check "health" 200 "$(http $BASE/health)"
check "create" 201 "$(http -X POST $BASE/api/products -H "$JSON" -d "{\"pid\":$PID,\"pname\":\"Laptop\",\"price\":1200,\"quantity\":5}")"
contains "read one" '"pname":"Laptop"' "$(curl -s $BASE/api/products/$PID)"
check "update" 200 "$(http -X PUT $BASE/api/products/$PID -H "$JSON" -d '{"price":1100,"quantity":8}')"
contains "du lieu sau khi sua" '"price":1100' "$(curl -s $BASE/api/products/$PID)"
check "trung pid" 409 "$(http -X POST $BASE/api/products -H "$JSON" -d "{\"pid\":$PID,\"pname\":\"Trung\",\"price\":10,\"quantity\":1}")"
check "gia am" 400 "$(http -X POST $BASE/api/products -H "$JSON" -d "{\"pid\":$((PID+1)),\"pname\":\"Am\",\"price\":-5,\"quantity\":1}")"
check "pid khong phai so" 400 "$(http $BASE/api/products/abc)"
check "delete" 200 "$(http -X DELETE $BASE/api/products/$PID)"
check "da xoa thi 404" 404 "$(http $BASE/api/products/$PID)"

echo "TAT CA KIEM TRA DAT"
