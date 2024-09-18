// src/vision/vision.service.ts
import { Injectable } from '@nestjs/common';
const vision = require('@google-cloud/vision');  // require로 변경

@Injectable()
export class VisionService {
  private client: any;

  constructor() {
    this.client = new vision.ImageAnnotatorClient();  // Google Vision API 클라이언트 초기화
  }

  async extractTextFromImage(imagePath: string): Promise<string[]> {
    try {
      const [result] = await this.client.textDetection(imagePath);  // 비동기 호출
      const detections = result?.textAnnotations || [];
      return detections.map(text => text.description);
    } catch (error) {
      console.error('Error during text detection:', error);
      throw new Error('Text detection failed');
    }
  }
}