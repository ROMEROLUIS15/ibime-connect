import type { ITool } from '../domain/interfaces/index.js';

export class ToolRegistry {
  private tools: Map<string, ITool> = new Map();

  registerTool(tool: ITool): void {
    this.tools.set(tool.name, tool);
  }

  getTools(): ITool[] {
    return Array.from(this.tools.values());
  }

  getTool(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  async executeTool(name: string, argsJson: string): Promise<string> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    try {
      const args = JSON.parse(argsJson);
      const result = await tool.execute(args);
      return JSON.stringify(result);
    } catch (error: any) {
      return JSON.stringify({ error: `Tool execution failed: ${error.message}` });
    }
  }
}
