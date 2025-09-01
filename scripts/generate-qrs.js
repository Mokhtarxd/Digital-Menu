/*
Generate QR codes for each available table label and save PNGs to /public/qrs.
Each QR encodes a deep link like `${BASE_URL}/table/<labelOrNumber>`.
*/

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const BASE_URL = process.env.QR_BASE_URL || 'http://localhost:8080';

// Minimal fetch to Supabase REST (PostgREST) to read public tables
async function fetchTables() {
  const url = `${SUPABASE_URL}/rest/v1/tables?select=label,is_available&order=label.asc`;
  const res = await fetch(url, {
    headers: {
      apikey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${process.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch tables: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  if (!SUPABASE_URL || !process.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in environment.');
    process.exit(1);
  }
  const outDir = path.resolve(__dirname, '../public/qrs');
  fs.mkdirSync(outDir, { recursive: true });

  const tables = await fetchTables();
  const available = tables.filter(t => t.is_available !== false);

  for (const t of available) {
    const label = String(t.label);
    // Link pattern consumed by TableSelection QR detection
    const url = `${BASE_URL}/table/${label.replace(/^T/, '')}`;
    const file = path.join(outDir, `${label}.png`);
    await QRCode.toFile(file, url, { margin: 1, width: 512 });
    console.log(`QR generated: ${file} -> ${url}`);
  }

  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
