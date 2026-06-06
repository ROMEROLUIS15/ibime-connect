import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentController } from '../../controllers/agent.controller.js';
import type { CurationGraph } from '../../modules/agents/curation-graph.js';
import type { Request, Response, NextFunction } from 'express';

describe('AgentController', () => {
  let controller: AgentController;
  let mockCurationGraph: CurationGraph;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockCurationGraph = {
      curate: vi.fn().mockResolvedValue({
        approved: true,
        iterations: 1,
        conflicts: [],
        extractedItems: [
          {
            title: "Curso Mérida",
            category: "curso",
            content: "Curso de pintura al óleo tradicional.",
            keyDetails: "Sábados"
          }
        ]
      })
    } as unknown as CurationGraph;

    controller = new AgentController(mockCurationGraph);

    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  it('debería retornar 400 si no se provee el texto en el body', async () => {
    mockRequest.body = { text: '' };

    await controller.handleCurationRequest(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      message: 'Debe proveer el texto del documento a analizar en el cuerpo (text).'
    }));
  });

  it('debería retornar 200 con el reporte de curación si el texto es válido', async () => {
    mockRequest.body = { text: 'Texto de prueba del catálogo de Mérida' };

    await controller.handleCurationRequest(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockCurationGraph.curate).toHaveBeenCalledWith(
      'Texto de prueba del catálogo de Mérida',
      undefined
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      iterations: 1,
      conflicts: [],
      items: expect.any(Array)
    }));
  });
});
