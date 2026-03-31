import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Skill loader — reads skills/*/SKILL.md from the repo root
// ---------------------------------------------------------------------------

export interface Skill {
  name: string;
  description: string;
  body: string; // full markdown content (including frontmatter)
}

export function parseFrontmatter(content: string): {
  name: string;
  description: string;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error("SKILL.md missing YAML frontmatter");
  }

  const frontmatter = match[1];

  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m);

  if (!nameMatch) throw new Error("SKILL.md frontmatter missing 'name' field");
  if (!descMatch)
    throw new Error("SKILL.md frontmatter missing 'description' field");

  return {
    name: nameMatch[1].trim(),
    description: descMatch[1].trim(),
    body: content, // return the full file — the LLM needs the complete instructions
  };
}

export function loadSkills(skillsDir: string): Skill[] {
  const skills: Skill[] = [];

  if (!fs.existsSync(skillsDir)) {
    console.error(`Skills directory not found: ${skillsDir}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillFile = path.join(skillsDir, entry.name, "SKILL.md");
    if (!fs.existsSync(skillFile)) continue;

    try {
      const content = fs.readFileSync(skillFile, "utf-8");
      const skill = parseFrontmatter(content);
      skills.push(skill);
    } catch (err) {
      console.error(`Warning: Failed to parse ${skillFile}: ${err}`);
    }
  }

  return skills;
}

export function loadSkill(skillsDir: string, dirName: string): Skill {
  const skillFile = path.join(skillsDir, dirName, "SKILL.md");

  if (!fs.existsSync(skillFile)) {
    throw new Error(`Skill not found: ${skillFile}`);
  }

  const content = fs.readFileSync(skillFile, "utf-8");
  return parseFrontmatter(content);
}
