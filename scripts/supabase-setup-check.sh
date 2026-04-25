#!/bin/bash
# Quick Supabase health check — run this to verify project is online
SUPABASE_URL="https://eqqllaiswgkoxrivgmig.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcWxsYWlzd2drb3hyaXZnbWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NjY5NjAsImV4cCI6MjA5MjA0Mjk2MH0.D8KuzcRktLom6lTL7QChPih8CmZaThEpjy5lGYl-ZAM"

echo "Checking Supabase project health..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/materials?select=id&limit=1" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY")

if [ "$STATUS" = "200" ]; then
  echo "ONLINE - Materials table exists and is accessible"
elif [ "$STATUS" = "404" ]; then
  echo "ONLINE - But materials table does not exist yet (need to run SQL setup)"
elif [ "$STATUS" = "401" ]; then
  echo "ONLINE - Auth issue (check anon key)"
else
  echo "OFFLINE or ERROR - HTTP $STATUS (project may be paused)"
fi
