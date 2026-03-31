import fs from 'fs'
import path from 'path'

// Skills live in .claude/skills/ at the monorepo root.
// From apps/api/src/modules/ai/skill-composer/, go up 6 levels to reach the root.
const SKILLS_BASE = path.resolve(__dirname, '../../../../../../.claude/skills')

function readSkill(skillName: string): string | null {
  const skillPath = path.join(SKILLS_BASE, skillName, 'SKILL.md')
  try {
    const raw = fs.readFileSync(skillPath, 'utf-8')
    // Strip YAML frontmatter (--- ... ---)
    return raw.replace(/^---[\s\S]*?---\n/, '').trim()
  } catch {
    console.warn(`[skill-composer] Skill não encontrada: ${skillName}`)
    return null
  }
}

export const skillComposer = {
  buildSystemPrompt(skills: string[]): string {
    // Always inject business-context first
    const allSkills = ['business-context', ...skills.filter((s) => s !== 'business-context')]
    const parts: string[] = []

    for (const skill of allSkills) {
      const content = readSkill(skill)
      if (content) parts.push(content)
    }

    return parts.join('\n\n---\n\n')
  },
}
