import { config } from 'dotenv';
import { from } from 'env-var';
import { Options } from 'nodemailer/lib/smtp-transport';
import { resolve } from 'node:path';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { DataSourceOptions } from 'typeorm';

config({ path: resolve(process.cwd(), '../', '.env') });

const env = from(process.env);

const discord = {
    clientId: env.get('DISCORD_CLIENT_ID').required().asString(),
    guildId: env.get('DISCORD_GUILD_ID').required().asString(),
    clientSecret: env.get('DISCORD_CLIENT_SECRET').required().asString(),
};

const main = {
    assetsAutoRouting: env.get('ASSETS_AUTO_ROUTING').required().asBoolStrict(),
    accessJwtAge: env.get('ACCESS_JWT_AGE').default(5 * 60).asIntPositive(),
    refreshJwtAge: env.get('REFRESH_JWT_AGE').default(30 * 24 * 60 * 60).asIntPositive(),
    savePlainPassword: env.get('SAVE_PLAIN_PASSWORD').default('false').asBoolStrict(),
    name: env.get('NAME').default('FrysHost').asString(),
    apiUrl: env.get('API_URL').default(3000).asUrlObject(),
    baseUrl: env.get('BASE_URL').default(4000).asUrlObject(),
    recaptchaSecret: env.get('RECAPTCHA_SECRET').required().asString(),
    debug: env.get('DEBUG').default('false').asBoolStrict(),
    devMode: env.get('NODE_ENV').asString() === 'dev',
    port: env.get('API_PORT').default(3000).asPortNumber(),
    logger: env.get('LOGGER').required(false).asString(),
};

const mailer: Options = {
    host: env.get('MAIL_HOST').required().asString(),
    port: env.get('MAIL_PORT').default(465).asPortNumber(),
    secure: env.get('MAIL_SECURE').default(env.get('MAIL_PORT').default(465).asPortNumber() == 465 ? 'true' : 'false').asBoolStrict(),
    auth: {
        user: env.get('MAIL_USER').required().asString(),
        pass: env.get('MAIL_PASS').required().asString(),
    },
};

const database: DataSourceOptions = {
    type: 'mongodb',
    host: env.get('DB_HOST').required().asString(),
    port: env.get('DB_PORT').required().asPortNumber(),
    username: env.get('DB_USER').required().asString(),
    password: env.get('DB_PASS').required().asString(),
    database: env.get('DB_DATABASE').required().asString(),
    timezone: 'Z',
    entities: [ resolve(__dirname, '../api/**/*.entity.ts') ],
};

export default { ...main, database, mailer, discord };