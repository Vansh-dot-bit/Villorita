const fs = require('fs');
const path = require('path');

const filesToFix = [
  "c:\\projects\\pur\\app\\api\\users\\route.ts",
  "c:\\projects\\pur\\app\\api\\user\\profile\\route.ts",
  "c:\\projects\\pur\\app\\api\\user\\addresses\\route.ts",
  "c:\\projects\\pur\\app\\api\\payment\\create-order\\route.ts",
  "c:\\projects\\pur\\app\\api\\products\\route.ts",
  "c:\\projects\\pur\\app\\api\\orders\\route.ts",
  "c:\\projects\\pur\\app\\api\\coupons\\route.ts"
];

for (const filePath of filesToFix) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace export async function METHOD(request) with export async function METHOD(request: NextRequest)
  content = content.replace(/export async function (GET|POST|PUT|PATCH|DELETE)\(request\)/g, "export async function $1(request: NextRequest)");

  // Import NextRequest if not present but we added it
  if (content !== originalContent && !content.includes("NextRequest")) {
    if (content.includes("import { NextResponse } from 'next/server';")) {
        content = content.replace("import { NextResponse } from 'next/server';", "import { NextRequest, NextResponse } from 'next/server';");
    } else if (content.includes("import {NextResponse} from 'next/server';")) {
        content = content.replace("import {NextResponse} from 'next/server';", "import { NextRequest, NextResponse } from 'next/server';");
    } else {
        content = "import { NextRequest } from 'next/server';\n" + content;
    }
  }
  
  // also handle NextRequest already imported but just fixing parameter type, shouldn't need logic
  // Just in case it imports NextResponse but we just added NextRequest it's handled above.

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}
