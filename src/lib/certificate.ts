import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { api } from '@/lib/api';

// 기부확인서 PDF — 서버 URL로 바로 보내지 않고 앱 안에서 자연스럽게 처리
// 네이티브: 캐시에 내려받아 공유 시트(미리보기·파일 저장·공유)로 띄움
// 웹: 새 탭에서 PDF 열기
export async function openCertificatePdf(donationId: number): Promise<void> {
  const url = api.certificatePdfUrl(donationId);

  if (Platform.OS === 'web') {
    window.open(url, '_blank');
    return;
  }

  const fileUri = `${FileSystem.cacheDirectory}ieum-donation-${donationId}.pdf`;
  const download = await FileSystem.downloadAsync(url, fileUri);
  if (download.status !== 200) throw new Error('확인서 PDF를 내려받지 못했어요.');

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(download.uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: '기부 확인서',
    });
  } else {
    // 공유 시트를 못 쓰는 환경에서는 인앱 브라우저로 폴백
    await WebBrowser.openBrowserAsync(url);
  }
}
