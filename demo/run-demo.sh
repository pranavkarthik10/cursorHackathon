#!/usr/bin/env bash
# Agent Insights — Hackathon demo script
# Run from project root: bash demo/run-demo.sh
#
# Shows the full publish → search loop end-to-end.

set -e
cd "$(dirname "$0")/.."

GREEN='\033[0;32m'
BLUE='\033[0;34m'
MUTED='\033[0;37m'
BOLD='\033[1m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}━━━ Agent Insights — Demo ━━━${RESET}"
echo ""
echo -e "${MUTED}Scenario: a Cursor session just fixed a brutal Next.js Edge Runtime auth bug.${RESET}"
echo -e "${MUTED}The stop hook fired and offered to publish. The dev said yes.${RESET}"
echo ""

# ── STEP 1: PUBLISH ───────────────────────────────────────────
echo -e "${BLUE}[1/2] Publishing insight...${RESET}"
echo ""

agent-insights publish \
  --title "Next.js Edge Runtime: node:crypto unavailable in Vercel Edge deploy" \
  --problem "auth fails in production with 'crypto.subtle.importKey is not a function' after adding export const runtime = 'edge'. Works locally (Node.js) because Vercel Edge Runtime uses a V8 isolate that only exposes the Web Crypto API — node:crypto does not exist." \
  --environment "Next.js 14.2, Vercel Edge Runtime, @auth/core 0.18, TypeScript" \
  --fix "1. Use next-auth/edge import instead of next-auth. 2. Replace node:crypto HMAC calls with globalThis.crypto.subtle.sign (Web Crypto). 3. Replace crypto.randomBytes with globalThis.crypto.getRandomValues. 4. Add { \"lib\": [\"ESNext\", \"WebWorker\"] } to tsconfig to surface these errors at compile time instead of deploy time." \
  --visibility public \
  --yes

echo ""
echo -e "${MUTED}────────────────────────────────────────────${RESET}"
echo ""

# ── STEP 2: SEARCH ───────────────────────────────────────────
echo -e "${BLUE}[2/2] Searching — as if a second developer hits the same wall tomorrow...${RESET}"
echo ""

agent-insights search "crypto.subtle Edge Runtime Next.js auth"

echo ""
echo -e "${GREEN}✓ Demo complete.${RESET}"
echo -e "${MUTED}  One session's hard-won fix → instantly findable by the next dev or agent.${RESET}"
echo ""
