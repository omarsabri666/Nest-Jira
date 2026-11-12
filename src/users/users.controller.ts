import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UpdateRolesDto } from './dto/update-roles.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserListDto } from './dto/user-list.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserDto } from './dto/user.dto';
import { UsersService } from './users.service';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { IdResponseDto } from '../common/dto/id-response.dto';
import { ApiEnvelopeResponse } from '../common/swagger/api-response.swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/profile')
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiEnvelopeResponse(UserDto)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getMyProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.findById(user.userId);
  }

  @RequirePermissions('user:read')
  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiEnvelopeResponse(UserListDto)
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @RequirePermissions('user:read')
  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiEnvelopeResponse(UserDto)
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @RequirePermissions('user:update')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiEnvelopeResponse(UserDto)
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({ description: 'Email already in use' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @RequirePermissions('user:update')
  @Patch(':id/roles')
  @ApiOperation({ summary: 'Update the roles of a user' })
  @ApiEnvelopeResponse(UserDto)
  @ApiNotFoundResponse({ description: 'User or role not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  updateRoles(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRolesDto) {
    return this.usersService.updateRoles(id, dto.roleIds);
  }

  @RequirePermissions('user:delete')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiEnvelopeResponse(IdResponseDto)
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.usersService.remove(id, user.userId);
  }
}
