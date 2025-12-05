import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '../../models/users/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (user.role !== UserRole.ADMIN && user.role !== 'admin') {
      throw new ForbiddenException(
        'Acesso negado. Apenas administradores podem realizar esta ação.',
      );
    }

    return true;
  }
}

