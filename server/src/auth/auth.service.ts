import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from 'src/enum/role.enum';
import { BcryptService } from 'src/security/bcrypt/bcrypt.service';
import { AuthTokenPayload, JwtService } from 'src/security/jwt/jwt.service';
import { UserService } from 'src/user/user.service';
import { UserLoginDto } from './dto/login.dto';
import { UserRegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly bcryptService: BcryptService,
        private readonly jwtService: JwtService,
    ) {}

    private buildAuthPayload(user: { id: string; name: string; email: string; role: Role }): AuthTokenPayload {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    }

    async registerUserService(payload: UserRegisterDto) {
        const existingUser = await this.userService.findByEmail(payload.email);
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await this.bcryptService.hash(payload.password);
        const createdUser = await this.userService.createUser({
            name: payload.name,
            email: payload.email,
            role: payload.role,
            password: hashedPassword,
        });

        const authPayload = this.buildAuthPayload(createdUser);
        const accessToken = this.jwtService.sign(authPayload);

        return {
            accessToken,
            user: authPayload,
        };
    }

    async loginUserService(payload: UserLoginDto) {
        const existingUser = await this.userService.findByEmail(payload.email);
        if (!existingUser) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const passwordMatches = await this.bcryptService.compare(
            payload.password,
            existingUser.password,
        );
        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const authPayload = this.buildAuthPayload(existingUser);
        const accessToken = this.jwtService.sign(authPayload);

        return {
            accessToken,
            user: authPayload,
        };
    }
}
