import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] ${err.message}`);
  console.error(err.stack);

  res.status(500).json({
    text: "Lo siento, hubo un problema al procesar tu consulta. Por favor intenta de nuevo en unos minutos o llama al 0274-2623898.",
    error: err.message || "Error interno del servidor",
  });
};
