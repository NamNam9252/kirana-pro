import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
    constructor() {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('DATABASE_URL is required');
        }

        const caPath = path.resolve(process.cwd(), 'prisma', 'ca.pem');
        const ca = fs.readFileSync(caPath, 'utf8');
        const url = new URL(connectionString);
        const database = url.pathname.replace(/^\//, '');
        const adapter = new PrismaPg({
            host: url.hostname,
            port: url.port ? Number(url.port) : 5432,
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database,
            ssl: {
                ca,
                rejectUnauthorized: true,
            },
        });
        super({ adapter });
    }
}
