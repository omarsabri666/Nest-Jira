import { ApiProperty } from '@nestjs/swagger';

import { IssueListItemDto } from './issue-list-item.dto';

export class IssueListDto {
  @ApiProperty({ type: [IssueListItemDto], description: 'List of issues' })
  items!: IssueListItemDto[];
}
