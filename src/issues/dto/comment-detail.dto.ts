import { ApiProperty } from '@nestjs/swagger';

import { UserSummaryDto } from '../../common/dto/user-summary.dto';

export class CommentDetailDto {
  @ApiProperty({ example: 10, description: 'Comment ID' })
  id!: number;

  @ApiProperty({ example: 'I found the root cause', description: 'Comment body' })
  body!: string;

  @ApiProperty({ example: 3, description: 'Author user ID' })
  authorId!: number;

  @ApiProperty({ example: 1, description: 'Issue ID' })
  issueId!: number;

  @ApiProperty({ example: '2026-08-18T10:00:00.000Z', description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-18T10:00:00.000Z', description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiProperty({ type: UserSummaryDto, description: 'Comment author' })
  author!: UserSummaryDto;
}
