import { ServeStaticModule } from '@nestjs/serve-static';

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { VisionModule } from './vision/vision.module';
import { ConfigModule } from '@nestjs/config';
import { diskStorage } from 'multer';  // diskStorage 가져오기
import * as fs from 'fs';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    VisionModule,
    // 정적 파일 제공 (HTML 페이지를 위해)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    // Multer 파일 업로드 설정
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = './uploads';  // 업로드될 폴더 설정
          // 폴더가 없으면 생성
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);  // 저장할 폴더 경로 전달
        },
        filename: (req, file, cb) => {
          // 고유한 파일명 설정
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
          cb(null, uniqueSuffix);
        },
      }),
    }),
  ],
})
export class AppModule {}