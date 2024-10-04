import { Injectable } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';

@Injectable()
export class VisionService {
  private client: ImageAnnotatorClient;

  constructor() {
    this.client = new ImageAnnotatorClient();
  }

  // 기존 파일 경로에서 텍스트 추출하는 메서드
  async extractTextFromImage(imagePath: string): Promise<string[]> {
    try {
      console.log('Vision API 호출 중...');
      const [result] = await this.client.textDetection(imagePath);
      const detections = result?.textAnnotations || [];
      return detections.map(text => text.description);
    } catch (error) {
      console.error('텍스트 감지 오류:', error);
      throw new Error('텍스트 감지 실패');
    }
  }

  // 파일 버퍼에서 텍스트를 추출하는 메서드 추가
  async extractTextFromBuffer(imageBuffer: Buffer): Promise<string[]> {
    try {
      console.log('Vision API 호출 중 (버퍼 사용)...');
      const [result] = await this.client.textDetection({
        image: { content: imageBuffer.toString('base64') }
      });
      const detections = result?.textAnnotations || [];
      return detections.map(text => text.description);
    } catch (error) {
      console.error('텍스트 감지 오류:', error);
      throw new Error('텍스트 감지 실패');
    }
  }
}