import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';

import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import {
  DashboardSummaryDto,
  IssueTrendsDto,
  PriorityDistributionDto,
  StatusDistributionDto,
} from './dto/dashboard-response.dto';
import { CurrentUser, type CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ApiEnvelopeResponse } from '../common/swagger/api-response.swagger';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get a summary of project health' })
  @ApiEnvelopeResponse(DashboardSummaryDto)
  summary(@CurrentUser() user: CurrentUserPayload, @Query() query: DashboardQueryDto) {
    return this.dashboardService.summary(user.userId, this.isAdmin(user), query);
  }

  @Get('status-distribution')
  @ApiOperation({ summary: 'Get the distribution of issues by status' })
  @ApiEnvelopeResponse(StatusDistributionDto)
  statusDistribution(@CurrentUser() user: CurrentUserPayload, @Query() query: DashboardQueryDto) {
    return this.dashboardService.statusDistribution(user.userId, this.isAdmin(user), query);
  }

  @Get('priority-distribution')
  @ApiOperation({ summary: 'Get the distribution of issues by priority' })
  @ApiEnvelopeResponse(PriorityDistributionDto)
  priorityDistribution(@CurrentUser() user: CurrentUserPayload, @Query() query: DashboardQueryDto) {
    return this.dashboardService.priorityDistribution(user.userId, this.isAdmin(user), query);
  }

  @Get('issue-trends')
  @ApiOperation({ summary: 'Get issues created over a date range' })
  @ApiEnvelopeResponse(IssueTrendsDto)
  issueTrends(@CurrentUser() user: CurrentUserPayload, @Query() query: DashboardQueryDto) {
    return this.dashboardService.issueTrends(user.userId, this.isAdmin(user), query);
  }

  private isAdmin(user: CurrentUserPayload): boolean {
    return user.roles.includes(RoleName.ADMIN);
  }
}
