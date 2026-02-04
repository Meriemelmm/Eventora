import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/RegisterDto.dto';
import { LoginDto } from './dto/LoginData.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerData: RegisterDto) {
    const user = await this.authService.register(registerData);
    
    return {
      success: true,
      message: "Registration succeeded",
      data: user
    };
  }

}