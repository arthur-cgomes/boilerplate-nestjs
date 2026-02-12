import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { FeatureFlag } from './entity/feature-flag.entity';
import { FeatureFlagService } from './feature-flag.service';
import { FeatureFlagController } from './feature-flag.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([FeatureFlag]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [FeatureFlagController],
  providers: [FeatureFlagService],
  exports: [FeatureFlagService],
})
export class FeatureFlagModule {}
