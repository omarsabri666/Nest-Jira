import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RoleName } from '@prisma/client';

import { ProjectRole } from './decorators/project-role.decorator';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectDetailDto } from './dto/project-detail.dto';
import { ProjectListDto } from './dto/project-list.dto';
import { ProjectMemberRemoveDto } from './dto/project-member-remove.dto';
import { ProjectMemberDto } from './dto/project-member.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectRoleGuard } from './guards/project-role.guard';
import { ProjectsService } from './projects.service';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IdResponseDto } from '../common/dto/id-response.dto';
import { ApiEnvelopeResponse } from '../common/swagger/api-response.swagger';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a project' })
  @ApiEnvelopeResponse(ProjectDetailDto, { status: 201 })
  @ApiConflictResponse({ description: 'Project key already in use' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List projects' })
  @ApiEnvelopeResponse(ProjectListDto)
  findAll(@CurrentUser() user: CurrentUserPayload, @Query() query: ProjectQueryDto) {
    const isAdmin = user.roles.includes(RoleName.ADMIN);
    return this.projectsService.findAll(user.userId, query, isAdmin);
  }

  @UseGuards(ProjectRoleGuard)
  @Get(':projectId')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiEnvelopeResponse(ProjectDetailDto)
  @ApiNotFoundResponse({ description: 'Project not found' })
  @ApiForbiddenResponse({ description: 'Not a member of this project' })
  findById(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectsService.findById(projectId);
  }

  @UseGuards(ProjectRoleGuard)
  @ProjectRole('OWNER')
  @Patch(':projectId')
  @ApiOperation({ summary: 'Update a project' })
  @ApiEnvelopeResponse(ProjectDetailDto)
  @ApiConflictResponse({ description: 'Project key already in use' })
  @ApiForbiddenResponse({ description: 'Requires project OWNER role' })
  update(@Param('projectId', ParseIntPipe) projectId: number, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(projectId, dto);
  }

  @UseGuards(ProjectRoleGuard)
  @ProjectRole('OWNER')
  @Delete(':projectId')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiEnvelopeResponse(IdResponseDto)
  @ApiNotFoundResponse({ description: 'Project not found' })
  @ApiForbiddenResponse({ description: 'Requires project OWNER role' })
  remove(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectsService.remove(projectId);
  }

  @UseGuards(ProjectRoleGuard)
  @ProjectRole('OWNER')
  @Post(':projectId/members')
  @ApiOperation({ summary: 'Add a member to a project' })
  @ApiEnvelopeResponse(ProjectMemberDto, { status: 201 })
  @ApiConflictResponse({ description: 'User is already a member' })
  @ApiNotFoundResponse({ description: 'Project or user not found' })
  @ApiForbiddenResponse({ description: 'Requires project OWNER role' })
  addMember(@Param('projectId', ParseIntPipe) projectId: number, @Body() dto: AddMemberDto) {
    return this.projectsService.addMember(projectId, dto);
  }

  @UseGuards(ProjectRoleGuard)
  @ProjectRole('OWNER')
  @Patch(':projectId/members/:userId')
  @ApiOperation({ summary: 'Update a member role in a project' })
  @ApiEnvelopeResponse(ProjectMemberDto)
  @ApiNotFoundResponse({ description: 'User is not a member of this project' })
  @ApiForbiddenResponse({ description: 'Requires project OWNER role' })
  updateMemberRole(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.projectsService.updateMemberRole(projectId, userId, dto.role);
  }

  @UseGuards(ProjectRoleGuard)
  @ProjectRole('OWNER')
  @Delete(':projectId/members/:userId')
  @ApiOperation({ summary: 'Remove a member from a project' })
  @ApiEnvelopeResponse(ProjectMemberRemoveDto)
  @ApiNotFoundResponse({ description: 'User is not a member of this project' })
  @ApiForbiddenResponse({ description: 'Requires project OWNER role' })
  removeMember(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.projectsService.removeMember(projectId, userId, user.userId);
  }
}
