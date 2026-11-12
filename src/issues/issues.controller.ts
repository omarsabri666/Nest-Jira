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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CommentCreateDto } from './dto/comment-create.dto';
import { CommentDetailDto } from './dto/comment-detail.dto';
import { CommentUpdateDto } from './dto/comment-update.dto';
import { CreateIssueDto } from './dto/create-issue.dto';
import { IssueDetailDto } from './dto/issue-detail.dto';
import { IssueListDto } from './dto/issue-list.dto';
import { IssueQueryDto } from './dto/issue-query.dto';
import { IssueStatusDto } from './dto/issue-status.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssueDeleteGuard } from './guards/issue-delete.guard';
import { IssuesService } from './issues.service';
import { CurrentUser, type CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { IdResponseDto } from '../common/dto/id-response.dto';
import { ApiEnvelopeResponse } from '../common/swagger/api-response.swagger';
import { ProjectRoleGuard } from '../projects/guards/project-role.guard';

@ApiTags('Issues')
@ApiBearerAuth()
@Controller('projects/:projectId/issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @UseGuards(ProjectRoleGuard)
  @Post()
  @ApiOperation({ summary: 'Create an issue in a project' })
  @ApiEnvelopeResponse(IssueDetailDto, { status: 201 })
  @ApiForbiddenResponse({ description: 'Not a member of this project' })
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateIssueDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.issuesService.create(projectId, user.userId, dto);
  }

  @UseGuards(ProjectRoleGuard)
  @Get()
  @ApiOperation({ summary: 'List issues in a project' })
  @ApiEnvelopeResponse(IssueListDto)
  @ApiForbiddenResponse({ description: 'Not a member of this project' })
  findAll(@Param('projectId', ParseIntPipe) projectId: number, @Query() query: IssueQueryDto) {
    return this.issuesService.findAll(projectId, query);
  }

  @UseGuards(ProjectRoleGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get an issue by ID' })
  @ApiEnvelopeResponse(IssueDetailDto)
  @ApiNotFoundResponse({ description: 'Issue not found' })
  @ApiForbiddenResponse({ description: 'Not a member of this project' })
  findById(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.issuesService.findById(projectId, id);
  }

  @UseGuards(ProjectRoleGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an issue' })
  @ApiEnvelopeResponse(IssueDetailDto)
  @ApiNotFoundResponse({ description: 'Issue not found' })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  @ApiForbiddenResponse({ description: 'Not a member of this project' })
  update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIssueDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.issuesService.update(projectId, id, dto, user);
  }

  @UseGuards(ProjectRoleGuard)
  @Post(':id/status')
  @ApiOperation({ summary: 'Transition an issue status' })
  @ApiEnvelopeResponse(IssueDetailDto)
  @ApiNotFoundResponse({ description: 'Issue not found' })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  @ApiForbiddenResponse({ description: 'Not a member of this project' })
  transition(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: IssueStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.issuesService.transition(projectId, id, dto, user);
  }

  @UseGuards(IssueDeleteGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an issue' })
  @ApiEnvelopeResponse(IdResponseDto)
  @ApiNotFoundResponse({ description: 'Issue not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  remove(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.issuesService.remove(projectId, id);
  }

  @UseGuards(ProjectRoleGuard)
  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to an issue' })
  @ApiEnvelopeResponse(CommentDetailDto, { status: 201 })
  @ApiNotFoundResponse({ description: 'Issue not found' })
  @ApiForbiddenResponse({ description: 'Not a member of this project' })
  addComment(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CommentCreateDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.issuesService.addComment(projectId, id, user.userId, dto);
  }

  @UseGuards(ProjectRoleGuard)
  @Patch(':id/comments/:commentId')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiEnvelopeResponse(CommentDetailDto)
  @ApiNotFoundResponse({ description: 'Comment not found' })
  @ApiForbiddenResponse({ description: 'Only the author, project owner, or an admin can modify' })
  updateComment(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: CommentUpdateDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.issuesService.updateComment(projectId, id, commentId, user.userId, dto, user);
  }

  @UseGuards(ProjectRoleGuard)
  @Delete(':id/comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiEnvelopeResponse(IdResponseDto)
  @ApiNotFoundResponse({ description: 'Comment not found' })
  @ApiForbiddenResponse({ description: 'Only the author, project owner, or an admin can delete' })
  deleteComment(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.issuesService.deleteComment(projectId, id, commentId, user.userId, user);
  }
}
