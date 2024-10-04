import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VisionService } from './vision.service';

@Controller('vision')
export class VisionController {
  constructor(private readonly visionService: VisionService) {}

  @Post('extract-text')
  @UseInterceptors(FileInterceptor('image'))
  async extractText(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new Error('파일 버퍼를 찾을 수 없습니다.');
    }

    // 버퍼에서 텍스트 추출
    const extractedText = await this.visionService.extractTextFromBuffer(file.buffer);
    
    console.log('버퍼 추출 완료');
    // Fine-tuned GPT-4 모델에 텍스트 전송 (extractedText를 문자열로 변환)
    const modelOutput = await this.visionService.sendTextToFineTunedModel(extractedText.join(' ')); // 배열을 문자열로 변환
    
    return { text: extractedText, modelOutput }; // 두 가지 정보를 반환
  }
}