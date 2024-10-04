import { Injectable } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class VisionService {
  private client: ImageAnnotatorClient;

  constructor(private configService: ConfigService) {
    this.client = new ImageAnnotatorClient();
  }

  // constructor() {
  //   this.client = new ImageAnnotatorClient();
  // }

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

  // Fine-tuned GPT-4 모델에 텍스트를 전송하는 메서드
  async sendTextToFineTunedModel(conversation: string): Promise<any> {
    try {
      const apiUrl = 'https://api.openai.com/v1/chat/completions'; // 실제 API URL
      const response = await axios.post(apiUrl, {
        model: this.configService.get<string>('FINE_TUNED_MODEL'),
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that extracts intent, tablets, times, and days information from conversations.',
          },
          {
            role: 'user',
            content: conversation, // 사용자 대화 내용
          },
        ],
        max_tokens: 1000, // 필요한 토큰 수 설정
        temperature: 0,
      }, {
        headers: {
          'Authorization': `Bearer ${this.configService.get<string>('OPENAI_API_KEY')}`,
        }
      });

      console.log('Model response:', response.data);
      console.log('Assistant message:', response.data.choices[0].message); // 추가된 부분
      return response.data.choices[0].message.content; // 응답의 형식에 맞게 수정
    } catch (error) {
      console.error('Fine-tuned 모델 호출 오류:', error);
      throw new Error('Fine-tuned 모델 호출 실패');
    }
  }
}
