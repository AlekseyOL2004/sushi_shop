#!/usr/bin/env bash
# Simple test requests for the students
# Usage: ./api/test_requests.sh

BASE_URL="http://localhost:3001"

echo "Create user (valid):"
curl -s -X POST "$BASE_URL/users" -H "Content-Type: application/json" -d '{"firstName":"Ivan","lastName":"Petrov","email":"ivan.petrov@example.com"}' | jq .

echo "\nCreate user (invalid email):"
curl -s -w "\nHTTP_CODE:%{http_code}\n" -X POST "$BASE_URL/users" -H "Content-Type: application/json" -d '{"firstName":"Invalid","lastName":"Email","email":"not-an-email"}'

echo "\nGet all users:"
curl -s "$BASE_URL/users" | jq .
