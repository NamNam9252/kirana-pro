import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/enum/role.enum';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

    findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    createUser(data: { name: string; email: string; password: string; role: Role }) {
        return this.prisma.user.create({
            data,
        });
    }
}
