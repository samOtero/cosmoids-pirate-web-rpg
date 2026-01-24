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

    if (!fileName || !dialogName || !config) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Sanitize filename
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9_-]/g, "");
    
    // 1. Define paths
    const dialogsDir = path.join(process.cwd(), "src", "constants", "dialogs");
    const filePath = path.join(dialogsDir, `${sanitizedFileName}.ts`);
    const indexPath = path.join(process.cwd(), "src", "constants", "dialogs.ts");

    // 2. Intelligent Stringification
    // We want to replace string values with their Enum equivalents in the generated code.
    // JSON.stringify will always quote strings. So we use placeholders and remove quotes later.
    
    const replacer = (key: string, value: any) => {
      // Handle BackgroundImageKey
      if (key === "backgroundImageKey") {
        const enumKey = getEnumKeyByValue(BackgroundImageKey, value);
        if (enumKey) {
          return `@@BG_ENUM:${enumKey}@@`;
        }
      }
      
      // Handle SpeakerImageKey (usually in 'key' property of portraits)
      if (key === "key") {
        // We can't be 100% sure this "key" is a SpeakerImageKey just by name, 
        // but in the context of DialogConfig, it likely is if it matches a value.
        const enumKey = getEnumKeyByValue(SpeakerImageKey, value);
        if (enumKey) {
            return `@@SP_ENUM:${enumKey}@@`;
        }
      }
      
      return value;
    };

    let jsonString = JSON.stringify(config, replacer, 2);

    // 3. Post-process to remove quotes around Enums and restore valid TS syntax
    // "@@BG_ENUM:CALEB_HOUSE@@" -> BackgroundImageKey.CALEB_HOUSE
    jsonString = jsonString.replace(/"@@BG_ENUM:([a-zA-Z0-9_]+)@@"/g, "BackgroundImageKey.$1");
    jsonString = jsonString.replace(/"@@SP_ENUM:([a-zA-Z0-9_]+)@@"/g, "SpeakerImageKey.$1");

    const fileContent = `import { DialogConfig, BackgroundImageKey, SpeakerImageKey } from "@/types/baseGame";

export const ${dialogName}: DialogConfig = ${jsonString};
`;

    // 4. Write the new dialog file
    await fs.writeFile(filePath, fileContent, "utf-8");

    // 5. Update index file
    const indexContent = await fs.readFile(indexPath, "utf-8");
    const exportStatement = `export * from "./dialogs/${sanitizedFileName}";`;

    if (!indexContent.includes(exportStatement)) {
      await fs.appendFile(indexPath, `\n${exportStatement}`);
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
