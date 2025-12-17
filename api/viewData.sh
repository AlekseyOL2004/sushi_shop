#!/bin/bash

echo "=== Viewing MongoDB Data ==="
echo ""

docker exec -it api_db_dev mongosh --eval "
use api;
print('=== ORDERS ===');
db.orders.find().forEach(printjson);
print('');
print('=== MENU ITEMS ===');
db.menuitems.find().forEach(printjson);
print('');
print('=== REVIEWS ===');
db.reviews.find().forEach(printjson);
print('');
print('=== USERS ===');
db.users.find().forEach(printjson);
"
