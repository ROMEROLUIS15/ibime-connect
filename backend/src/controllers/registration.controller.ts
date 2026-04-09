import { Request, Response, NextFunction } from 'express';
import { RegistrationService } from '../services/registration.service.js';
import { createCourseRegistrationSchema } from '../shared/validators/schemas.js';

export class RegistrationController {
  constructor(private container?: any) {}

  handleRegistration = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = createCourseRegistrationSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Datos de inscripción inválidos",
          details: validation.error.format()
        });
      }

      await RegistrationService.register(validation.data);

      return res.status(201).json({ message: "Inscripción completada exitosamente" });

    } catch (error) {
      next(error);
    }
  };
}
