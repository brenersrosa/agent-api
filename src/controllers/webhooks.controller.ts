import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WebhooksService } from '../services/webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}
}
