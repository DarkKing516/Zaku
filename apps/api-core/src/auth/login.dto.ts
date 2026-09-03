import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: faker.internet.email() })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: faker.internet.password({ length: 12 }) })
  @IsString()
  @MinLength(8)
  password!: string;
}
