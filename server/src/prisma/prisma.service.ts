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

        const url = new URL(connectionString);
        const database = url.pathname.replace(/^\//, '');
        const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname);

        let sslConfig: object | undefined;
        if (!isLocal) {
            const caPath = path.resolve(process.cwd(), 'prisma', 'ca.pem');
            const ca = fs.readFileSync(caPath, 'utf8');
            sslConfig = { ca, rejectUnauthorized: true };
        }

        const adapter = new PrismaPg({
            host: url.hostname,
            port: url.port ? Number(url.port) : 5432,
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database,
            ...(sslConfig ? { ssl: sslConfig } : {}),
        });
        super({ adapter });
    }
}
