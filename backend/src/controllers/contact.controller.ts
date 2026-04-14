import { Request, Response, NextFunction } from 'express';
import { ContactService } from '../services/contact.service.js';
import { createContactMessageSchema } from '@shared/validators/schemas.js';

export class ContactController {
  constructor() { }

  handleSubmission = async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.requestId;

    try {
      const validation = createContactMessageSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          text: 'Datos de contacto inválidos',
          details: validation.error.format()
        });
      }

      await ContactService.createMessage(validation.data, requestId);

      return res.status(201).json({ message: 'Mensaje enviado exitosamente' });
    } catch (error) {
      next(error);
    }
  };
}
