import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './employee-profile/auth/auth.module';
import { TimeManagementModule } from './time-management/time-management.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { LeavesModule } from './leaves/leaves.module';
import { PayrollTrackingModule } from './payroll-tracking/payroll-tracking.module';
import { EmployeeProfileModule } from './employee-profile/employee-profile.module';
import { PerformanceModule } from './performance/performance.module';
import { PayrollConfigurationModule } from './payroll-configuration/payroll-configuration.module';
import { PayrollExecutionModule } from './payroll-execution/payroll-execution.module';

import { OrganizationStructureModule } from './organization-structure/organization-structure.module';

import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import type { Connection } from 'mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      useFactory: () => {
        let mongoUri =
          process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hr_system';

        // Ensure database name is in URI for MongoDB Atlas connections
        // If URI doesn't end with a database name, append it
        if (
          mongoUri.includes('mongodb+srv://') ||
          mongoUri.includes('mongodb://')
        ) {
          const uriWithoutDb = mongoUri.replace(/\/[^/]*$/, ''); // Remove trailing database name if exists
          const dbName = 'hr_system';
          if (
            !mongoUri.endsWith('/' + dbName) &&
            !mongoUri.match(/\/[^/]+\?/)
          ) {
            // Only append if not already there and no query params
            mongoUri = uriWithoutDb + '/' + dbName;
            console.log(
              `🔧 Adjusted MONGO_URI to include database: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`,
            );
          }
        }

        return {
          uri: mongoUri,
          dbName: 'hr_system', // Explicitly set database name (backup)
          connectionFactory: (connection: Connection) => {
            // Set up event listeners
            connection.on('connected', () => {
              console.log('✅ MongoDB connected successfully!');
              const actualDbName =
                connection.db?.databaseName || connection.name || 'unknown';
              console.log(`📊 Database: ${actualDbName}`);
              console.log(
                `📊 Connection URI (masked): ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`,
              );
            });
            connection.on('error', (err) => {
              console.error('❌ MongoDB connection error:', err);
            });
            connection.on('disconnected', () => {
              console.log('⚠️  MongoDB disconnected');
            });

            // Wait a bit and check connection state (in case connection happens before listener)
            setTimeout(() => {
              // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
              if (connection.readyState === 1 as number) {
                console.log('✅ MongoDB connected successfully!');
                const actualDbName =
                  connection.db?.databaseName || connection.name || 'unknown';
                console.log(`📊 Database: ${actualDbName}`);
                console.log(`📊 Connection name: ${connection.name}`);
              }
            }, 100);

            return connection;
          },
        };
      },
    }),

    AuthModule,

    // Load everything else first
    TimeManagementModule,
    RecruitmentModule,
    LeavesModule,
    PayrollExecutionModule,
    PayrollConfigurationModule,
    PayrollTrackingModule,
    EmployeeProfileModule,
    PerformanceModule,

    // Load OrganizationStructureModule LAST
    // so that Department schema is guaranteed to be registered
    OrganizationStructureModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
