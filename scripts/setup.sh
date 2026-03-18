#!/bin/bash
set -e

echo "=== RoleGPT Setup ==="

# Backend
echo ""
echo "→ Setting up Python backend..."
cd backend

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "  Created backend/.env from example. Add your GEMINI_API_KEY!"
fi

pip install -r requirements.txt
echo "  Backend dependencies installed."
echo "  Indexing seed jobs (this downloads the embedding model on first run)..."
python indexer.py
echo "  Seed jobs indexed."

cd ..

# Frontend
echo ""
echo "→ Setting up React frontend..."
cd frontend
npm install
echo "  Frontend dependencies installed."
cd ..

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Edit backend/.env — add GEMINI_API_KEY, SUPABASE_URL, SUPABASE_KEY"
echo "  2. Run supabase_schema.sql in your Supabase SQL editor"
echo "  3. Start backend:  cd backend && uvicorn app:app --reload"
echo "  4. Start frontend: cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:5173"
