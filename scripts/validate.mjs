#!/usr/bin/env node
/**
 * Validates every bundled SKILL.md against the Agent Skills specification
 * constraints that Pi actually enforces (or would enforce if a stricter
 * implementation read the file):
 *
 *   - frontmatter delimited by `---` on its own lines
 *   - `name` required: lowercase letters/digits/hyphens, no leading/trailing/
 *     consecutive hyphens, <= 64 chars, equal to the parent directory
 *   - `description` required, <= 1024 chars, and routing-bearing
 *     (must say when to load it, not just what it is)
 *   - body is not empty
 *
 * No dependencies: the checks are regex + length comparisons, so this runs on
 * a bare checkout without `npm install`.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(ROOT, "skills");

const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_NAME = 64;
const MAX_DESCRIPTION = 1024;

/** Every directory under skills/ that contains a SKILL.md. */
function findSkillFiles(dir) {
	const out = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (!statSync(full).isDirectory()) continue;
		const candidate = join(full, "SKILL.md");
		try {
			statSync(candidate);
			out.push(candidate);
		} catch {
			out.push(...findSkillFiles(full));
		}
	}
	return out;
}

/** Minimal frontmatter reader: `key: value` pairs, no nested structures needed. */
function readFrontmatter(raw) {
	if (!raw.startsWith("---")) {
		return { error: "file does not start with a `---` frontmatter delimiter" };
	}
	const end = raw.indexOf("\n---", 3);
	if (end === -1) {
		return { error: "frontmatter is not closed by a `---` line" };
	}
	const block = raw.slice(3, end);
	const fields = {};
	for (const line of block.split("\n")) {
		if (!line.trim()) continue;
		const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
		if (!match) continue;
		fields[match[1]] = match[2].trim();
	}
	return { fields, body: raw.slice(end + 4).trim() };
}

const problems = [];
const checked = [];

for (const file of findSkillFiles(SKILLS_DIR)) {
	const rel = relative(ROOT, file).replace(/\\/g, "/");
	const raw = readFileSync(file, "utf8");
	const parsed = readFrontmatter(raw);

	if (parsed.error) {
		problems.push(`${rel}: ${parsed.error}`);
		continue;
	}

	const { fields, body } = parsed;
	const name = fields.name ?? "";
	const description = fields.description ?? "";

	if (!name) problems.push(`${rel}: missing \`name\``);
	else {
		if (!NAME_RE.test(name)) problems.push(`${rel}: \`name\` "${name}" is not lowercase-hyphen form`);
		if (name.length > MAX_NAME) problems.push(`${rel}: \`name\` exceeds ${MAX_NAME} chars`);
		const parent = basename(dirname(file));
		if (name !== parent) problems.push(`${rel}: \`name\` "${name}" differs from directory "${parent}"`);
	}

	if (!description) problems.push(`${rel}: missing \`description\``);
	else if (description.length > MAX_DESCRIPTION) {
		problems.push(`${rel}: \`description\` exceeds ${MAX_DESCRIPTION} chars (${description.length})`);
	} else if (!/\buse when\b/i.test(description)) {
		problems.push(`${rel}: \`description\` carries no routing phrase ("Use when …")`);
	}

	if (!body) problems.push(`${rel}: body is empty`);

	checked.push({ rel, name, description: description.length });
}

if (checked.length === 0) problems.push("no SKILL.md found under skills/");

for (const skill of checked) {
	console.log(`ok  ${skill.rel}  name=${skill.name}  description=${skill.description} chars`);
}

if (problems.length > 0) {
	console.error(`\n${problems.length} problem(s):`);
	for (const problem of problems) console.error(`  ✖ ${problem}`);
	process.exit(1);
}

console.log(`\nvalidated ${checked.length} skill(s)`);
