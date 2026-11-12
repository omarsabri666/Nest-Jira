import { ApiProperty } from '@nestjs/swagger';

import { ProjectListItemDto } from './project-list-item.dto';
import { ProjectMemberSummaryDto } from './project-member-summary.dto';

export class ProjectDetailDto extends ProjectListItemDto {
  @ApiProperty({ type: [ProjectMemberSummaryDto], description: 'Project members' })
  members!: ProjectMemberSummaryDto[];
}
