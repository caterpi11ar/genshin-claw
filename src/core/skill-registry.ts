import type { SkillDefinition } from "./types.js";
import { logger } from "../utils/logger.js";

export class SkillRegistry {
  private skills = new Map<string, SkillDefinition>();

  /**
   * Register a skill. Throws if the name is already registered.
   */
  register(skill: SkillDefinition): void {
    if (this.skills.has(skill.name)) {
      throw new Error(`Skill "${skill.name}" is already registered`);
    }
    this.skills.set(skill.name, skill);
    logger.debug(`Registered skill: ${skill.name}`);
  }

  /**
   * Register multiple skills at once.
   */
  registerAll(skills: SkillDefinition[]): void {
    for (const skill of skills) {
      this.register(skill);
    }
  }

  /**
   * Get a skill by name.
   */
  get(name: string): SkillDefinition | undefined {
    return this.skills.get(name);
  }

  /**
   * Get all registered skills.
   */
  getAll(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  /**
   * Check if a skill is registered.
   */
  has(name: string): boolean {
    return this.skills.has(name);
  }
}
