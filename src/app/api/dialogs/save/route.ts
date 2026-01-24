import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { DialogConfig, BackgroundImageKey, SpeakerImageKey } from "@/types/baseGame";

// Reverse mappings for Enums to find the Key by Value
function getEnumKeyByValue(enumObj: any, value: string): string | undefined {
  return Object.keys(enumObj).find((key) => enumObj[key] === value);
}

export async function POST(req: NextRequest) {
  try {
    const { fileName, dialogName, config } = await req.json();

    if (!dialogName || !config) {
      return NextResponse.json(
        { error: "Missing required fields (dialogName, config)" },
        { status: 400 }
      );
    }
    
    // 1. Define paths
    const dialogsDir = path.join(process.cwd(), "src", "constants", "dialogs");
    const indexPath = path.join(process.cwd(), "src", "constants", "dialogs.ts");

    let targetFileName = fileName;

    // 1b. If no filename provided, try to find existing file
    if (!targetFileName) {
        const files = await fs.readdir(dialogsDir);
        for (const file of files) {
            const filePath = path.join(dialogsDir, file);
            const content = await fs.readFile(filePath, "utf-8");
            
            // Look for "export const [dialogName]:"
            // We use simple string match or regex to be safe
            // Ideally we check "export const DIALOG_NAME" or "export const DIALOG_NAME:"
            if (content.includes(`export const ${dialogName}:`) || content.includes(`export const ${dialogName} =`)) {
                // Found it! Use this filename (without extension is cleaner if we sanitize later, but let's keep it consistent)
                // Actually the valid filename logic expects NO extension below sanitizedFileName.
                targetFileName = file.replace(/\.ts$/, "");
                break;
            }
        }
    }

    if (!targetFileName) {
         return NextResponse.json(
            { error: "Filename not provided and existing dialog not found." },
            { status: 400 }
         );
    }

    // Sanitize filename
    const sanitizedFileName = targetFileName.replace(/[^a-zA-Z0-9_-]/g, "");
    const filePath = path.join(dialogsDir, `${sanitizedFileName}.ts`);

    // 2. Intelligent Stringification
    const replacer = (key: string, value: any) => {
      if (key === "backgroundImageKey") {
        const enumKey = getEnumKeyByValue(BackgroundImageKey, value);
        if (enumKey) return `@@BG_ENUM:${enumKey}@@`;
      }
      if (key === "key") {
        const enumKey = getEnumKeyByValue(SpeakerImageKey, value);
        if (enumKey) return `@@SP_ENUM:${enumKey}@@`;
      }
      return value;
    };

    let jsonString = JSON.stringify(config, replacer, 2);
    jsonString = jsonString.replace(/"@@BG_ENUM:([a-zA-Z0-9_]+)@@"/g, "BackgroundImageKey.$1");
    jsonString = jsonString.replace(/"@@SP_ENUM:([a-zA-Z0-9_]+)@@"/g, "SpeakerImageKey.$1");

    const newExportStr = `export const ${dialogName}: DialogConfig = ${jsonString};`;

    // 3. Read existing file if it exists to preserve other exports
    let fileContent = "";
    let fileExists = false;
    
    try {
        fileContent = await fs.readFile(filePath, "utf-8");
        fileExists = true;
    } catch (e) {
        // File doesn't exist, create fresh
        fileContent = `import { DialogConfig, BackgroundImageKey, SpeakerImageKey } from "@/types/baseGame";\n\n`;
    }

    // 4. Update or Append
    // We look for `export const DIALOG_NAME: DialogConfig = { ... };` or `export const DIALOG_NAME = ...`
    // Regex needs to handle multiline. It's tricky to match the closing brace perfectly with regex.
    // However, since we formatted it ourselves (presumably), or standard TS format...
    // A safer bet might be to split by `export const`.
    
    // STRATEGY: 
    // If the file contains the export variable, we replace the declaration.
    // We assume the declaration starts with `export const NAME` and ends before the next `export const` or End of File.
    
    const exportStartMarker = `export const ${dialogName}`;
    
    if (fileContent.includes(exportStartMarker)) {
        // REPLACE MODE
        // Note: usage of 's' flag for dotAll is important, but JS regex support varies in older nodes. Node 18+ supports it.
        // We try to match: export const NAME ... = { ... }; (roughly)
        // Matching balanced braces is hard. 
        // fallback: If we can't reliably replace, we potentially warn or fail?
        // Let's try to match until the next `export` or `end of string`.
        
        // Regex: Find "export const NAME" ... until (Next "export" OR End of File)
        // We use a lookahead for the next export to stop matching.
        // Caveat: This assumes "export" keyword doesn't appear inside strings/comments.
        
        const regex = new RegExp(`export const ${dialogName}(?:[:\\s][^;]+)?;`, "s"); 
        // Wait, our JSON output ends with `;`? We added `;` in `newExportStr`.
        // What if existing code doesn't have `;` or has weird formatting?
        
        // Simpler approach: 
        // If we found the file, maybe we shouldn't try to be too smart if it's complex.
        // BUT we MUST solve the data loss issue.
        
        // Let's try exact match replacement if possible? No.
        
        // Let's replace by Splitting.
        const parts = fileContent.split(exportStartMarker);
        if (parts.length >= 2) {
             // parts[0] is everything BEFORE.
             // parts[1] is everything AFTER start of export.
             // We need to find where this export ENDS. 
             // It ends at the next `export` or EOF.
             
             const afterPart = parts[1];
             const nextExportIndex = afterPart.indexOf("export const");
             
             let remainingContent = "";
             if (nextExportIndex !== -1) {
                 remainingContent = afterPart.substring(nextExportIndex);
             } else {
                 // Check for trailing stuff that isn't part of the object? 
                 // It's hard.
                 // Maybe we just assume if it's the last one, we replace clear to end? 
                 // Or we preserve imports at top and append if safe?
                 remainingContent = ""; // checking EOF
             }

             // Reconstruct
             // BEWARE: This logic is brittle if `export const` appears in comments.
             
             // Robust alternative: regex 
             // match `export const NAME ... ;`
             // relying on `;` as terminator.
             
             const regex = new RegExp(`export const ${dialogName}[^]*?;`, "g");
             // [^]*? matches any char (including newlines) non-greedy until semicolon.
             // This assumes the valid TS file has a semicolon at the end of the const decl.
             // Our generator adds it. Existing files usually have it.
             
             if (regex.test(fileContent)) {
                 fileContent = fileContent.replace(regex, newExportStr.trim());
             } else {
                 // Fallback: If no semicolon found (e.g. malformed), append it?
                 // Or maybe it ends with `}` and no semicolon?
                 // Let's try matching `export const NAME ... };` OR `export const NAME ... }`
                 console.log("Could not find clean match for replacement, appending instead might cause dupe error but safer than data loss.");
                 // Actually, duplicate export is a build error.
                 // Let's try one more loose regex:
                 // export const NAME ... (lookahead for export or $)
                 
                 const looseRegex = new RegExp(`export const ${dialogName}[\\s\\S]*?(?=(export const|$))`);
                 fileContent = fileContent.replace(looseRegex, newExportStr + "\n\n");
             }
        }
    } else {
        // APPEND MODE
        fileContent += `\n\n${newExportStr}`;
    }

    // Write it back
    await fs.writeFile(filePath, fileContent, "utf-8");

    // 5. Update index file
    const indexContent = await fs.readFile(indexPath, "utf-8");
    const exportStatement = `export * from "./dialogs/${sanitizedFileName}";`;

    if (!indexContent.includes(exportStatement)) {
      await fs.appendFile(indexPath, `\n${exportStatement}`);
    }

    // 6. Update DialogContext Enum in baseGame.ts
    const baseGamePath = path.join(process.cwd(), "src", "types", "baseGame.ts");
    let baseGameContent = await fs.readFile(baseGamePath, "utf-8");
    
    // Check if the key already exists in the enum
    // Regex matches: GAME_INTRO = "GAME_INTRO", or similar
    // We assume the key name is the dialogName (variable name)
    const contextKey = dialogName; 
    
    if (!baseGameContent.includes(`${contextKey} = "${contextKey}"`)) {
        // Insert it into the enum
        // Look for "export enum DialogContext {"
        const enumStart = "export enum DialogContext {";
        const parts = baseGameContent.split(enumStart);
        
        if (parts.length >= 2) {
            // parts[1] starts with the enum content.
            // We just insert at the beginning of the enum block for simplicity
            baseGameContent = parts[0] + enumStart + `\n  ${contextKey} = "${contextKey}",` + parts[1];
            await fs.writeFile(baseGamePath, baseGameContent, "utf-8");
        }
    }

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error("Error saving dialog:", error);
    return NextResponse.json(
      { error: "Failed to save dialog" },
      { status: 500 }
    );
  }
}
