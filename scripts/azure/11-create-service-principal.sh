#!/bin/bash
# Usage: ./11-create-service-principal.sh <resource_group> <sp_name>
# Example: ./11-create-service-principal.sh sushi-shop-rg github-sushi-shop-deploy

set -e

RESOURCE_GROUP="${1:-sushi-shop-rg}"
SP_NAME="${2:-github-sushi-shop-deploy}"
ROLE="Contributor"

# === Пояснення для Sushi Shop проекту ===
# Цей скрипт створює Service Principal для GitHub Actions
# Дефолтні значення:
#   RESOURCE_GROUP=sushi-shop-rg (має співпадати з попереднім скриптом)
#   SP_NAME=github-sushi-shop-deploy (унікальна назва для SP)
#   ROLE=Contributor (права на деплой)

echo "=== Creating Service Principal for GitHub Actions ==="
echo "Resource Group: $RESOURCE_GROUP"
echo "Service Principal Name: $SP_NAME"
echo ""

SUBSCRIPTION_ID=$(az account show --query id --output tsv)
echo "Subscription ID: $SUBSCRIPTION_ID"
echo ""

echo "Checking if Service Principal '$SP_NAME' exists..."
EXISTING_SP=$(az ad sp list --display-name "$SP_NAME" --query "[0].appId" --output tsv 2>/dev/null || true)

if [ -n "$EXISTING_SP" ] && [ "$EXISTING_SP" != "None" ]; then
  echo "⚠ Service Principal '$SP_NAME' already exists (App ID: $EXISTING_SP)."
  echo ""
  echo "To reset credentials, run:"
  echo "----------------------------------------"
  echo "az ad sp credential reset --id $EXISTING_SP --query \"{clientId:appId, clientSecret:password, tenantId:tenant, subscriptionId:'$SUBSCRIPTION_ID'}\" --output json"
  echo "----------------------------------------"
  echo ""
  echo "📋 GitHub Secrets Setup Instructions:"
  echo "1. Run the command above to get new credentials"
  echo "2. Go to: https://github.com/AlekseyOL2004/sushi_shop/settings/secrets/actions"
  echo "3. Add/Update secret 'AZURE_CREDENTIALS' with the JSON output"
  echo "4. Add/Update secret 'AZURE_RESOURCE_GROUP' with value: $RESOURCE_GROUP"
else
  echo "Creating new Service Principal '$SP_NAME'..."
  CREDENTIALS=$(az ad sp create-for-rbac \
    --name "$SP_NAME" \
    --role "$ROLE" \
    --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
    --sdk-auth)
  
  echo ""
  echo "✓ Service Principal created successfully!"
  echo ""
  echo "=========================================="
  echo "📋 ADD THESE TO GITHUB SECRETS"
  echo "=========================================="
  echo ""
  echo "Secret 1: AZURE_CREDENTIALS"
  echo "Value (copy entire JSON below):"
  echo "----------------------------------------"
  echo "$CREDENTIALS"
  echo "----------------------------------------"
  echo ""
  echo "Secret 2: AZURE_RESOURCE_GROUP"
  echo "Value: $RESOURCE_GROUP"
  echo ""
  echo "=========================================="
  echo ""
  echo "🔗 Quick Links:"
  echo "GitHub Secrets: https://github.com/AlekseyOL2004/sushi_shop/settings/secrets/actions"
  echo "GitHub Actions: https://github.com/AlekseyOL2004/sushi_shop/actions"
  echo "Azure Portal: https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP"
  echo ""
  echo "📝 Step-by-Step Instructions:"
  echo "1. Open GitHub Secrets page (link above)"
  echo "2. Click 'New repository secret'"
  echo "3. Name: AZURE_CREDENTIALS"
  echo "4. Value: Copy the entire JSON from above (between dashes)"
  echo "5. Click 'Add secret'"
  echo "6. Repeat for AZURE_RESOURCE_GROUP with value: $RESOURCE_GROUP"
  echo ""
  echo "✅ After adding secrets:"
  echo "   git checkout frontend"
  echo "   git push origin frontend"
  echo ""
fi

echo "Done! ✓"