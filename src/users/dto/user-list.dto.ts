import { ApiProperty } from '@nestjs/swagger';

import { UserDto } from './user.dto';

export class UserListDto {
  @ApiProperty({ type: [UserDto], description: 'List of users' })
  items!: UserDto[];
}
