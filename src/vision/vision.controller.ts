import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VisionService } from './vision.service';
import { ConfigService } from '@nestjs/config'; // ConfigService import 추가

@Controller('vision')
export class VisionController {
  constructor(
    private readonly visionService: VisionService,
    private readonly configService: ConfigService // ConfigService 주입
  ) {}

  @Post('extract-text')
  @UseInterceptors(FileInterceptor('image'))
  async extractText(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new Error('파일 버퍼를 찾을 수 없습니다.');
    }

    // GCS에 이미지 업로드
    const fileName = `your_directory/${file.originalname}`; // 원하는 디렉토리 및 파일 이름 설정
    const bucketName = this.configService.get<string>('CLOUD_STORAGE_BUCKET');
    const imageUrl = await this.visionService.uploadImageToGCS(bucketName, fileName, file.buffer);
    console.log(imageUrl);
    
    // Naver Clova OCR 호출
    const extractedText = await this.visionService.extractTextFromNaverOCR(imageUrl);
    
    console.log('버퍼 추출 완료');
    // Fine-tuned GPT-4 모델에 텍스트 전송 (extractedText를 문자열로 변환)
    const modelOutput = await this.visionService.sendTextToFineTunedModel(extractedText.join(' ')); // 배열을 문자열로 변환
    
    return { imageUrl, text: extractedText, modelOutput }; // 이미지 URL, 텍스트, 모델 출력 반환
  }
}




    // Google vision API 호출
    // const extractedText = await this.visionService.extractTextFromBuffer(file.buffer);
