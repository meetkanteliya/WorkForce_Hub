#!/bin/bash

# Chat Improvements Setup Script
# This script applies all chat improvements to your WorkForce Hub project

echo "🚀 Applying Chat Improvements to WorkForce Hub..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Step 1: Backend Database Migration${NC}"
cd backend

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
fi

# Run migrations
echo "Running database migrations..."
python manage.py migrate chat

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database migration completed successfully${NC}"
else
    echo -e "${RED}❌ Migration failed. Please check the error above.${NC}"
    exit 1
fi

cd ..

echo ""
echo -e "${YELLOW}📦 Step 2: Frontend Setup${NC}"
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo -e "${GREEN}✅ Frontend setup completed${NC}"

cd ..

echo ""
echo -e "${GREEN}🎉 Chat improvements applied successfully!${NC}"
echo ""
echo "📋 Next Steps:"
echo "1. Start the backend server:"
echo "   cd backend && python manage.py runserver"
echo ""
echo "2. Start the frontend dev server:"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Test the new features:"
echo "   - Edit messages (click edit icon on your own messages)"
echo "   - Pin messages (admin/HR only - click pin icon)"
echo "   - Drag & drop files to upload"
echo "   - Search messages using the search bar"
echo "   - Reply to messages"
echo "   - Add emoji reactions"
echo ""
echo "📚 For detailed documentation, see: CHAT_IMPROVEMENTS.md"
echo ""
