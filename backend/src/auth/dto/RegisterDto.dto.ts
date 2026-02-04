import { IsString, MinLength, IsEmail, IsEnum, IsOptional } from "class-validator";
import { Role } from '../../common/enums';


export class RegisterDto {
  @IsString()
  @MinLength(3, { message: "The lastName should be at minimum 3 characters" })
  lastName: string;

  @IsString()
  @MinLength(3, { message: "The firstName should be at minimum 3 characters" })
  firstName: string;

  @IsEmail({}, { message: "Invalid email address" })
  email: string;

  @IsString()
  @MinLength(6, { message: "The password should be at minimum 6 characters" })
  password: string;

  @IsOptional()
  @IsEnum(Role, { message: "Role must be a valid enum value" })
  role?: Role;
}
