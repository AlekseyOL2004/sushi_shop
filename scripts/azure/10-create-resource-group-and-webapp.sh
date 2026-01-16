#!/bin/bash
# Usage: ./10-create-resource-group-and-webapp.sh <resource_group> <location> <webapp_name> <plan_name>
# Example: ./10-create-resource-group-and-webapp.sh sushi-shop-rg northeurope ztu-sushi-shop sushi-shop-plan

set -e

RESOURCE_GROUP="${1:-sushi-shop-rg}"
LOCATION="${2:-polandcentral}"
WEBAPP_NAME="${3:-ztu-sushi-shop}"
APP_SERVICE_PLAN="${4:-sushi-shop-plan}"
NODE_RUNTIME="node|20-lts"
SKU="F1"

# === Пояснення для Sushi Shop проекту ===
# Дефолтні значення налаштовані для вашого проекту:
#   RESOURCE_GROUP=sushi-shop-rg (група ресурсів для суші магазину)
#   LOCATION=polandcentral (Poland Central - часто доступний для студентських підписок)
#   WEBAPP_NAME=ztu-sushi-shop (назва веб-апу для фронтенду)
#   APP_SERVICE_PLAN=sushi-shop-plan (план App Service)
#   NODE_RUNTIME=node|20-lts (Node.js 20 LTS)
#   SKU=F1 (безкоштовний тарифний план)

# Приклади використання:
# 1. З дефолтними значеннями (рекомендовано):
#    ./scripts/azure/10-create-resource-group-and-webapp.sh
#
# 2. З власними значеннями:
#    ./scripts/azure/10-create-resource-group-and-webapp.sh my-rg westeurope my-webapp my-plan

echo "=== Creating Azure Resources for Sushi Shop ==="
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "Web App Name: $WEBAPP_NAME"
echo "App Service Plan: $APP_SERVICE_PLAN"
echo "Node Runtime: $NODE_RUNTIME"
echo "SKU: $SKU"
echo ""

echo "Checking resource group: $RESOURCE_GROUP"
if az group show --name "$RESOURCE_GROUP" &>/dev/null; then
  echo "✓ Resource group '$RESOURCE_GROUP' already exists."
else
  echo "Creating resource group '$RESOURCE_GROUP' in '$LOCATION'..."
  az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
  echo "✓ Resource group created."
fi

echo ""
echo "Checking App Service Plan: $APP_SERVICE_PLAN"
if az appservice plan show --name "$APP_SERVICE_PLAN" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  echo "✓ App Service Plan '$APP_SERVICE_PLAN' already exists."
else
  echo "Creating App Service Plan '$APP_SERVICE_PLAN'..."
  az appservice plan create \
    --name "$APP_SERVICE_PLAN" \
    --resource-group "$RESOURCE_GROUP" \
    --sku "$SKU" \
    --is-linux
  echo "✓ App Service Plan created."
fi

echo ""
echo "Checking Web App: $WEBAPP_NAME"
if az webapp show --name "$WEBAPP_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  echo "✓ Web App '$WEBAPP_NAME' already exists."
else
  echo "Creating Web App '$WEBAPP_NAME'..."
  az webapp create \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --plan "$APP_SERVICE_PLAN" \
    --runtime "$NODE_RUNTIME"
  echo "✓ Web App created."
fi

echo ""
echo "=== Summary ==="
echo "Resource Group: $RESOURCE_GROUP"
echo "Web App URL: https://$WEBAPP_NAME.azurewebsites.net"
echo ""
echo "Next steps:"
echo "1. Run the Service Principal creation script:"
echo "   ./scripts/azure/11-create-service-principal.sh $RESOURCE_GROUP github-sushi-shop-deploy"
echo "2. Add the credentials to GitHub Secrets"
echo "3. Push to 'frontend' branch to trigger deployment"
echo ""
echo "Done! ✓"