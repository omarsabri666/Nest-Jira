import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AppInfoDto } from './app-info.dto';
import { AppService } from './app.service';
import { ApiEnvelopeResponse } from './common/swagger/api-response.swagger';

@ApiTags('App')
@ApiBearerAuth()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get application information' })
  @ApiEnvelopeResponse(AppInfoDto)
  getAppInfo() {
    return this.appService.getAppInfo();
  }
}
