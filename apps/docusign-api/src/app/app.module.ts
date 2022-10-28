import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SignViaEmailService } from './components/sign-via-email.service';
@Module({
  imports: [],
  controllers: [AppController],
  providers: [SignViaEmailService],
})
export class AppModule {}
