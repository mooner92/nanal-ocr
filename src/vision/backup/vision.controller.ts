import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VisionService } from './vision.service';

@Controller('vision')
export class VisionController {
  constructor(private readonly visionService: VisionService) {}

  @Post('extract-text')
  @UseInterceptors(FileInterceptor('image'))
  async extractText(@UploadedFile() file: Express.Multer.File) {
    console.log(file);  // 파일 객체를 확인하여 path 확인

    if (!file || !file.buffer) {
      console.error('파일 버퍼를 찾을 수 없습니다. 현재 파일:', file);
      throw new Error('파일 버퍼를 찾을 수 없습니다.');
    }

    // 버퍼에서 텍스트 추출
    const extractedText = await this.visionService.extractTextFromBuffer(file.buffer);
    return { text: extractedText };
  }
}