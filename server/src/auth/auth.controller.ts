import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLoginDto } from './dto/login.dto';
import { UserRegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService : AuthService){}

    @Post('register')
    register(@Body() payload: UserRegisterDto){
        return this.authService.registerUserService(payload);
    }

    @Post('login')
    login(@Body() payload: UserLoginDto) {
        return this.authService.loginUserService(payload);
    }


}
