import { ApiProperty } from '@nestjs/swagger';

import { CommentDetailDto } from './comment-detail.dto';
import { IssueListItemDto } from './issue-list-item.dto';

export class IssueDetailDto extends IssueListItemDto {
  @ApiProperty({ type: [CommentDetailDto], description: 'Issue comments' })
  comments!: CommentDetailDto[];
}
