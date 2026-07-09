import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolRegistry } from '../../services/tools.service.js';
import type { ITool } from '../../domain/interfaces/index.js';

// --- Helpers ------------------------------------------------------------------

function buildTool(name: string, execute: ITool['execute']): ITool {
  return {
    name,
    description: `herramienta ${name}`,
    parameters: { type: 'object', properties: {} },
    execute,
  } as ITool;
}

// --- Suite --------------------------------------------------------------------

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  describe('registro', () => {
    it('devuelve una herramienta registrada por su nombre', () => {
      const tool = buildTool('check_registration', vi.fn());
      registry.registerTool(tool);

      expect(registry.getTool('check_registration')).toBe(tool);
      expect(registry.getTools()).toEqual([tool]);
    });

    it('devuelve undefined para una herramienta desconocida', () => {
      expect(registry.getTool('inexistente')).toBeUndefined();
    });

    it('empieza sin herramientas', () => {
      expect(registry.getTools()).toEqual([]);
    });

    it('registrar dos veces el mismo nombre sustituye a la anterior', () => {
      const vieja = buildTool('dup', vi.fn());
      const nueva = buildTool('dup', vi.fn());

      registry.registerTool(vieja);
      registry.registerTool(nueva);

      expect(registry.getTool('dup')).toBe(nueva);
      expect(registry.getTools()).toHaveLength(1);
    });
  });

  describe('executeTool', () => {
    it('parsea los argumentos, ejecuta y serializa el resultado', async () => {
      const execute = vi.fn().mockResolvedValue({ registrado: true });
      registry.registerTool(buildTool('check_registration', execute));

      const salida = await registry.executeTool('check_registration', '{"email":"a@b.com"}');

      expect(execute).toHaveBeenCalledWith({ email: 'a@b.com' });
      expect(salida).toBe('{"registrado":true}');
    });

    it('lanza cuando la herramienta no existe', async () => {
      // A diferencia de los fallos de ejecución, un nombre desconocido es un bug
      // del llamador, no una entrada del usuario: debe propagarse.
      await expect(registry.executeTool('fantasma', '{}')).rejects.toThrow('Tool fantasma not found');
    });

    it('devuelve un error serializado cuando los argumentos no son JSON válido', async () => {
      const execute = vi.fn();
      registry.registerTool(buildTool('t', execute));

      const salida = await registry.executeTool('t', '{ no es json');

      expect(JSON.parse(salida).error).toMatch(/^Tool execution failed:/);
      expect(execute).not.toHaveBeenCalled();
    });

    it('captura el fallo de la herramienta y lo devuelve como error serializado', async () => {
      // El LLM recibe este string como resultado de la tool: no debe romper el turno.
      registry.registerTool(buildTool('t', vi.fn().mockRejectedValue(new Error('DB caída'))));

      const salida = await registry.executeTool('t', '{}');

      expect(JSON.parse(salida)).toEqual({ error: 'Tool execution failed: DB caída' });
    });

    it('serializa correctamente un resultado nulo', async () => {
      registry.registerTool(buildTool('t', vi.fn().mockResolvedValue(null)));

      await expect(registry.executeTool('t', '{}')).resolves.toBe('null');
    });
  });
});
