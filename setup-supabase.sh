#!/bin/bash

# Supabase Migration & Setup Script
# This script helps you set up Supabase for the Todo App

set -e

echo "🚀 Supabase Setup Script"
echo "========================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local (remember to fill in your Supabase credentials)"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "📦 Installing dependencies..."

# Remove firebase if it exists
npm uninstall firebase 2>/dev/null || true

# Install supabase
npm install @supabase/supabase-js

echo "✅ Dependencies installed"

echo ""
echo "🎯 Setup Instructions:"
echo "====================="
echo ""
echo "1. Go to https://supabase.com and create a new project"
echo ""
echo "2. Get your credentials from Settings > API:"
echo "   - Copy Project URL to NEXT_PUBLIC_SUPABASE_URL"
echo "   - Copy Anon Key to NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo ""
echo "3. Export SQL schema (run in Supabase SQL Editor):"
echo "   - Open Supabase Dashboard > SQL Editor"
echo "   - Create new query"
echo "   - Paste content from: supabase_schema.sql"
echo "   - Execute"
echo ""
echo "4. Setup Google OAuth:"
echo "   - Go to https://console.cloud.google.com"
echo "   - Create OAuth 2.0 Client ID for Web"
echo "   - Get Client ID and Client Secret"
echo "   - In Supabase > Authentication > Providers > Google"
echo "   - Paste credentials"
echo ""
echo "5. Configure Redirect URLs in Supabase:"
echo "   - http://localhost:3000/auth/callback (dev)"
echo "   - https://yourdomain.com/auth/callback (prod)"
echo ""
echo "6. Update .env.local with your credentials"
echo ""
echo "7. Test locally:"
echo "   npm run dev"
echo ""
echo "8. Deploy to Vercel:"
echo "   - Add env vars to Vercel Dashboard"
echo "   - git push"
echo ""
echo "📚 Full documentation: See SUPABASE_SETUP.md"
echo ""
echo "✨ Ready to start! Run 'npm run dev' to test"
