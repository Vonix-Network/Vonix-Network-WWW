#!/usr/bin/env node

/**
 * Migration script for NextAuth v4 to v5
 * Updates all API routes to use the new auth() function
 */

const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace import statements
  if (content.includes("import { getServerSession } from 'next-auth';")) {
    content = content.replace(
      "import { getServerSession } from 'next-auth';",
      ''
    );
    modified = true;
  }

  if (content.includes("import { authOptions } from '@/lib/auth';")) {
    content = content.replace(
      "import { authOptions } from '@/lib/auth';",
      "import { auth } from '@/lib/auth';"
    );
    modified = true;
  }

  // Replace function calls
  if (content.includes('getServerSession(authOptions)')) {
    content = content.replace(/getServerSession\(authOptions\)/g, 'auth()');
    modified = true;
  }

  // Clean up extra blank lines
  content = content.replace(/\n\n\n+/g, '\n\n');

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }

  return false;
}

function walkDir(dir) {
  let updated = 0;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      updated += walkDir(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      if (updateFile(filePath)) {
        updated++;
      }
    }
  }

  return updated;
}

console.log('🔄 Migrating NextAuth API routes from v4 to v5...\n');
const count = walkDir(apiDir);
console.log(`\n✨ Updated ${count} file(s)`);
