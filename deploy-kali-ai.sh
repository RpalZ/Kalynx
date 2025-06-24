#!/bin/bash

# Deploy KaliAI Edge Function to Supabase
# This script deploys the kali-ai-chat function to your Supabase project

echo "🚀 Deploying KaliAI Edge Function..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Please install it first:"
    echo "npm install -g supabase"
    echo "Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory."
    echo "Make sure you're in the root of your project with supabase/config.toml"
    exit 1
fi

# Check if the function exists
if [ ! -d "supabase/functions/kali-ai-chat" ]; then
    echo "❌ KaliAI function not found at supabase/functions/kali-ai-chat"
    echo "Make sure the function directory exists with index.ts"
    exit 1
fi

echo "📋 Checking Supabase login status..."

# Check if user is logged in
if ! supabase status &> /dev/null; then
    echo "🔐 Please log in to Supabase first:"
    supabase login
fi

echo "🔧 Deploying the kali-ai-chat function..."

# Deploy the specific function
supabase functions deploy kali-ai-chat

if [ $? -eq 0 ]; then
    echo "✅ KaliAI function deployed successfully!"
    echo ""
    echo "🎉 Your KaliAI chatbot should now be working!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Make sure your DEEPSEEK_API_KEY is set in your Supabase project secrets"
    echo "2. Test the chatbot in your app"
    echo ""
    echo "🔑 To set your DeepSeek API key (if not already set):"
    echo "supabase secrets set DEEPSEEK_API_KEY=your_api_key_here"
    echo ""
    echo "🔍 To check function logs:"
    echo "supabase functions logs kali-ai-chat"
else
    echo "❌ Deployment failed. Please check the error messages above."
    echo ""
    echo "💡 Common issues:"
    echo "- Make sure you're logged in: supabase login"
    echo "- Check your internet connection"
    echo "- Verify the function code is valid TypeScript"
    exit 1
fi