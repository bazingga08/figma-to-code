#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# figma-to-code plugin updater
# Updates the plugin from git remote and syncs to Claude Code cache.
#
# Usage:
#   chmod +x UPDATE.sh
#   ./UPDATE.sh
#
# Or run from anywhere:
#   bash ~/.claude/plugins/marketplaces/figma-to-code/UPDATE.sh
# ──────────────────────────────────────────────────────────────

PLUGIN_NAME="figma-to-code"
CLAUDE_DIR="${HOME}/.claude"
SOURCE_DIR="${CLAUDE_DIR}/plugins/marketplaces/${PLUGIN_NAME}"
CACHE_BASE="${CLAUDE_DIR}/plugins/cache/${PLUGIN_NAME}/${PLUGIN_NAME}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "═══════════════════════════════════════════"
echo "  figma-to-code — Plugin Updater"
echo "═══════════════════════════════════════════"
echo ""

# ── Step 1: Find source directory ──
if [ ! -d "${SOURCE_DIR}" ]; then
  echo -e "${RED}✗ Source not found at: ${SOURCE_DIR}${NC}"
  echo "  Make sure the plugin is installed in ~/.claude/plugins/marketplaces/"
  exit 1
fi

echo -e "${GREEN}✓${NC} Source: ${SOURCE_DIR}"

# ── Step 2: Pull latest from remote ──
echo ""
echo "Pulling latest from remote..."
cd "${SOURCE_DIR}"

BEFORE=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
git pull origin main 2>&1 | tail -3
AFTER=$(git rev-parse HEAD 2>/dev/null || echo "unknown")

if [ "${BEFORE}" = "${AFTER}" ]; then
  echo -e "${YELLOW}  Already up to date (${AFTER:0:7})${NC}"
else
  echo -e "${GREEN}  Updated: ${BEFORE:0:7} → ${AFTER:0:7}${NC}"
fi

# ── Step 3: Find cache directory (auto-detect version) ──
CACHE_DIR=""
if [ -d "${CACHE_BASE}" ]; then
  # Find the latest version directory
  CACHE_DIR=$(find "${CACHE_BASE}" -maxdepth 1 -type d | sort -V | tail -1)
fi

if [ -z "${CACHE_DIR}" ] || [ "${CACHE_DIR}" = "${CACHE_BASE}" ]; then
  echo ""
  echo -e "${YELLOW}⚠ No cache directory found at: ${CACHE_BASE}${NC}"
  echo "  Cache will be created when you first use /figma-to-code in Claude Code."
  echo "  After that, re-run this script to sync."
  echo ""
  echo -e "${GREEN}✓ Git source is up to date. Done.${NC}"
  exit 0
fi

echo -e "${GREEN}✓${NC} Cache:  ${CACHE_DIR}"

# ── Step 4: Sync files from source to cache ──
echo ""
echo "Syncing to cache..."

SYNCED=0

# Sync skill file
SRC_SKILL="${SOURCE_DIR}/skills/figma-to-code/SKILL.md"
DST_SKILL="${CACHE_DIR}/skills/figma-to-code/SKILL.md"
if [ -f "${SRC_SKILL}" ] && [ -d "$(dirname "${DST_SKILL}")" ]; then
  cp "${SRC_SKILL}" "${DST_SKILL}"
  echo -e "  ${GREEN}✓${NC} SKILL.md"
  SYNCED=$((SYNCED + 1))
fi

# Sync all source files
if [ -d "${SOURCE_DIR}/src" ] && [ -d "${CACHE_DIR}/src" ]; then
  for src_file in "${SOURCE_DIR}"/src/*.js; do
    filename=$(basename "${src_file}")
    dst_file="${CACHE_DIR}/src/${filename}"
    if [ -f "${dst_file}" ]; then
      cp "${src_file}" "${dst_file}"
      echo -e "  ${GREEN}✓${NC} src/${filename}"
      SYNCED=$((SYNCED + 1))
    fi
  done
fi

# Sync reference files
if [ -d "${SOURCE_DIR}/skills/figma-to-code/references" ] && [ -d "${CACHE_DIR}/skills/figma-to-code/references" ]; then
  for ref_file in "${SOURCE_DIR}"/skills/figma-to-code/references/*.md; do
    [ -f "${ref_file}" ] || continue
    filename=$(basename "${ref_file}")
    cp "${ref_file}" "${CACHE_DIR}/skills/figma-to-code/references/${filename}"
    echo -e "  ${GREEN}✓${NC} references/${filename}"
    SYNCED=$((SYNCED + 1))
  done
fi

echo ""
echo "Synced ${SYNCED} files."

# ── Step 5: Verify ──
echo ""
echo "Verifying..."

PASS=true

# Check Three-Agent Pipeline
if grep -q "Agent 1: BUILDER" "${DST_SKILL}" 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} Three-Agent Pipeline (Builder, Verifier, Gatekeeper)"
else
  echo -e "  ${RED}✗${NC} Three-Agent Pipeline missing"
  PASS=false
fi

# Check Two-Channel Feedback
if grep -q "Channel 1:" "${DST_SKILL}" 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} Two-Channel User Feedback"
else
  echo -e "  ${RED}✗${NC} Two-Channel User Feedback missing"
  PASS=false
fi

# Check Engineering Mindset
if grep -q "Engineering Mindset" "${DST_SKILL}" 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} Engineering Mindset section"
else
  echo -e "  ${RED}✗${NC} Engineering Mindset section missing"
  PASS=false
fi

# Check Construction Blueprint principle
if grep -q "Construction Blueprint" "${DST_SKILL}" 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} Construction Blueprint (Principle #8)"
else
  echo -e "  ${RED}✗${NC} Construction Blueprint missing"
  PASS=false
fi

# Check Visual Complexity step
if grep -q "Identify Visual Complexity" "${DST_SKILL}" 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} Visual Complexity Per Section (Phase 2.5)"
else
  echo -e "  ${RED}✗${NC} Visual Complexity step missing"
  PASS=false
fi

# Check Questioning Protocol
if grep -q "Questioning Protocol" "${DST_SKILL}" 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} Questioning Protocol"
else
  echo -e "  ${RED}✗${NC} Questioning Protocol missing"
  PASS=false
fi

# Check expanded checklist (should have 50+ checklist items)
CHECKLIST_COUNT=$(grep -c "^\- \[ \]" "${DST_SKILL}" 2>/dev/null || echo 0)
if [ "${CHECKLIST_COUNT}" -ge 50 ]; then
  echo -e "  ${GREEN}✓${NC} Expanded checklist (${CHECKLIST_COUNT} items)"
else
  echo -e "  ${RED}✗${NC} Checklist too small (${CHECKLIST_COUNT} items, expected 50+)"
  PASS=false
fi

# Check blueprint-writer fix
BW_FILE="${CACHE_DIR}/src/blueprint-writer.js"
if [ -f "${BW_FILE}" ]; then
  if grep -q "this.#data.tokens.radii" "${BW_FILE}" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} blueprint-writer.js tokens fix"
  else
    echo -e "  ${RED}✗${NC} blueprint-writer.js still has tokens bug"
    PASS=false
  fi
fi

# ── Result ──
echo ""
if [ "${PASS}" = true ]; then
  echo -e "${GREEN}═══════════════════════════════════════════${NC}"
  echo -e "${GREEN}  ✓ Plugin updated and verified!${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════${NC}"
  echo ""
  echo "  Next: In Claude Code, run /reload-plugins"
  echo "  Then trigger /figma-to-code to use the latest."
else
  echo -e "${RED}═══════════════════════════════════════════${NC}"
  echo -e "${RED}  ✗ Verification failed — check errors above${NC}"
  echo -e "${RED}═══════════════════════════════════════════${NC}"
  exit 1
fi

echo ""
