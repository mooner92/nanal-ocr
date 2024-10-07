import { Injectable } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage'; // Google Cloud Storage 사용
import axios from 'axios';

@Injectable()
export class VisionService {
  private client: ImageAnnotatorClient;
  private storage: Storage; // Storage 인스턴스 추가

  constructor(private configService: ConfigService) {
    this.client = new ImageAnnotatorClient();
    this.storage = new Storage();
  }

  // Google Cloud Storage에 이미지 업로드
  async uploadImageToGCS(bucketName: string, fileName: string, imageBuffer: Buffer): Promise<string> {
    try {
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(fileName);
      const stream = file.createWriteStream({
        metadata: {
          contentType: 'image/jpeg', // 이미지 타입 설정
        },
      });

      stream.on('error', (err) => {
        console.error('GCS 업로드 오류:', err);
        throw new Error('GCS 업로드 실패');
      });

      stream.on('finish', () => {
        console.log(`파일 ${fileName}이(가) GCS에 업로드되었습니다.`);
      });

      stream.end(imageBuffer); // 버퍼 데이터를 GCS에 업로드
      return `https://storage.googleapis.com/${bucketName}/${fileName}`; // 업로드된 파일의 URL 반환
    } catch (error) {
      console.error('GCS 업로드 오류:', error);
      throw new Error('GCS 업로드 실패');
    }
  }

  // Google Cloud Vision API를 사용하여 이미지에서 텍스트 추출
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

  // Google Cloud Vision API를 사용하여 버퍼에서 텍스트 추출
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

  // Naver Clova OCR API를 사용하여 이미지에서 텍스트 추출
  async extractTextFromNaverOCR(imageUrl: string): Promise<string[]> {
    try {
      console.log('Naver Clova OCR 호출 중...');
      const response = await axios.post(`https://8gqvbgtnnm.apigw.ntruss.com/custom/v1/34860/2e652dcb90b77cb93bf55721d77d33d2bae7a6912d8bc0e3a210c7004e3c3875/general`, {
        version: "V2",
        requestId: "1234",
        timestamp: Date.now(),
        lang: "ko",
        images: [
          {
            format: "jpg",
            name: "demo_image",
            url: imageUrl // 이제 GCS에 업로드된 URL을 사용합니다.
          }
        ],
        enableTableDetection: false
      }, {
        headers: {
          'X-OCR-SECRET': this.configService.get<string>('CLOVA_OCR_SECRET'),
          'Content-Type': 'application/json'
        }
      });
  
      const extractedText = response.data.images[0].fields.map(field => field.inferText);
      return extractedText;
    } catch (error) {
      console.error('Naver Clova OCR 호출 오류:', error);
      throw new Error('Naver Clova OCR 호출 실패');
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



//'[{"intent": "유토펜세미정(내복) 복용", "tablets": 1, "times": 3, "days": 3}, {"intent": "알피레바이피드정 복용", "tablets": 0.5, "times": 3, "days": 3}, {"intent": "아로베스트정(내복) 복용", "tablets": 1, "times": 3, "days": 3}, {"intent": "소론도정(내복)(비급여) 복용", "tablets": 0.5, "times": 3, "days": 3}, {"intent": "알피올로파타딘정 복용", "tablets": 1, "times": 2, "days": 3}, {"intent": "일양바이오아세틸시스터인캡슐200mg 복용", "tablets": 1, "times": 3, "days": 3}, {"intent": "로벨리토정 150/10mg 복용", "tablets": 1, "times": 1, "days": 30}]'