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

// ---------------------------------------------------------------------------
// V2 loader — lean protocols + schemas for composable mode
// ---------------------------------------------------------------------------

export interface SkillV2 {
  name: string;
  description: string;
  protocol: string; // lean protocol.md or fallback to full SKILL.md body
  schema: object; // parsed schema.json or empty object
  body: string; // full SKILL.md (backward compat)
}

export function loadProtocol(skillsDir: string, dirName: string): string {
  const protocolFile = path.join(skillsDir, dirName, "protocol.md");
  if (fs.existsSync(protocolFile)) {
    return fs.readFileSync(protocolFile, "utf-8");
  }
  // Fallback: use full SKILL.md until protocol.md is created
  return loadSkill(skillsDir, dirName).body;
}

export function loadSchema(skillsDir: string, dirName: string): object {
  const schemaFile = path.join(skillsDir, dirName, "schema.json");
  if (fs.existsSync(schemaFile)) {
    return JSON.parse(fs.readFileSync(schemaFile, "utf-8"));
  }
  return {}; // empty schema = no constraint
}

export function loadSkillV2(skillsDir: string, dirName: string): SkillV2 {
  const skill = loadSkill(skillsDir, dirName);
  return {
    name: skill.name,
    description: skill.description,
    protocol: loadProtocol(skillsDir, dirName),
    schema: loadSchema(skillsDir, dirName),
    body: skill.body,
  };
}
