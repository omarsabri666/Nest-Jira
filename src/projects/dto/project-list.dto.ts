import { ApiProperty } from '@nestjs/swagger';

import { ProjectListItemDto } from './project-list-item.dto';

export class ProjectListDto {
  @ApiProperty({ type: [ProjectListItemDto], description: 'List of projects' })
  items!: ProjectListItemDto[];
}
