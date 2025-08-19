# Habits Huntrix (PWA) — Starter

Kid-friendly habit tracker (single parent account via email OTP), with points (+20/ +10 / 0), optional +200 seven-day streak bonus, and a PWA UI.

## Local dev
1) Create a Supabase project → copy Project URL + anon key
2) Copy .env.example → .env.local and paste values
3) npm install && npm run dev
4) Visit http://localhost:3000 and sign in from Settings (magic link)

## Deploy
- Import this repo into Vercel
- Add env vars on Vercel:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
- Open on your phone → Add to Home Screen (PWA)

## Database
In Supabase SQL Editor, run: supabase/sql/schema.sql
