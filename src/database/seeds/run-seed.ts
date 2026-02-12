import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { PasswordResetToken } from '../../auth/entity/password-reset-token.entity';
import { RefreshToken } from '../../auth/entity/refresh-token.entity';
import { FeatureFlag } from '../../feature-flag/entity/feature-flag.entity';
import { seedUsers } from './user.seed';
import { seedFeatureFlags } from './feature-flag.seed';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.TYPEORM_HOST,
  port: parseInt(process.env.TYPEORM_PORT || '5432'),
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  entities: [User, PasswordResetToken, RefreshToken, FeatureFlag],
  synchronize: false,
});

async function runSeeds() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    console.log('Running seeds...');
    await seedUsers(AppDataSource);
    await seedFeatureFlags(AppDataSource);

    console.log('Seeds completed successfully');
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error running seeds:', error);
    process.exit(1);
  }
}

runSeeds();
