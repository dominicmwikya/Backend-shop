import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:3001',
    credentials: true
  });

  const config = new DocumentBuilder()
    .setTitle('SHOP BACKEND')
    .setDescription('The SHOP API description')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('backend')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(5000);
  console.log("screte", process.env.SECRET_KEY_API_KEY)
}
bootstrap();