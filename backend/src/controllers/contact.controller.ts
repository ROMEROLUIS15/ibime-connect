import { Request, Response, NextFunction } from 'express';
import { ContactService } from '../services/contact.service.js';
import { createContactMessageSchema } from '../shared/validators/schemas.js';

export class ContactController {
  constructor(private container?: any) {}

  handleSubmission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = createContactMessageSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Datos de contacto inválidos",
          details: validation.error.format()
        });
      }

      await ContactService.createMessage(validation.data);

      return res.status(201).json({ message: "Mensaje enviado exitosamente" });

    } catch (error) {
      next(error);
    }
  };
}
