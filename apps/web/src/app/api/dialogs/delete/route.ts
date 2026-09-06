import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { dialogKey } = await req.json();

    if (!dialogKey) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const dialogsDir = path.join(process.cwd(), "src", "constants", "dialogs");
    const indexPath = path.join(process.cwd(), "src", "constants", "dialogs.ts");

    // 1. Find the file containing the export
    const files = await fs.readdir(dialogsDir);
    let foundFile = "";

    for (const file of files) {
      const filePath = path.join(dialogsDir, file);
      const content = await fs.readFile(filePath, "utf-8");
      
      // Look for "export const [dialogKey]:"
      if (content.includes(`export const ${dialogKey}:`)) {
        foundFile = file;
        break;
      }
    }

    if (!foundFile) {
      return NextResponse.json(
        { error: "Dialog file not found for this key" },
        { status: 404 }
      );
    }

    // 2. Delete the file
    const filePath = path.join(dialogsDir, foundFile);
    await fs.unlink(filePath);

    // 3. Remove export from index
    // The export likely looks like: export * from "./dialogs/foundFileWithoutExt";
    const fileNameNoExt = foundFile.replace(/\.ts$/, "");
    const indexContent = await fs.readFile(indexPath, "utf-8");
    
    const lines = indexContent.split("\n");
    const newLines = lines.filter(line => !line.includes(`"./dialogs/${fileNameNoExt}"`));
    
    await fs.writeFile(indexPath, newLines.join("\n"), "utf-8");

    // 4. Remove from DialogContext Enum in baseGame.ts
    // We need to know the *exported variable name* to remove it from the enum.
    // However, the delete API receives `dialogKey` which IS the variable name.
    
    const baseGamePath = path.join(process.cwd(), "src", "types", "baseGame.ts");
    let baseGameContent = await fs.readFile(baseGamePath, "utf-8");
    
    // We search for:   KEY = "KEY",
    // and remove that line.
    
    const enumLineRegex = new RegExp(`\\s*${dialogKey}\\s*=\\s*"${dialogKey}",?`);
    if (enumLineRegex.test(baseGameContent)) {
        baseGameContent = baseGameContent.replace(enumLineRegex, "");
        // Cleanup empty lines if necessary, but messy regex is risky. 
        // Simple replace is usually enough.
        await fs.writeFile(baseGamePath, baseGameContent, "utf-8");
    }

    return NextResponse.json({ success: true, deletedFile: foundFile });

  } catch (error) {
    console.error("Error deleting dialog:", error);
    return NextResponse.json(
      { error: "Failed to delete dialog" },
      { status: 500 }
    );
  }
}
