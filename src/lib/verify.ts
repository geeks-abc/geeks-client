// 마이페이지 수정 전 본인 확인 상태 (5분 유효, 메모리 보관)
let verifiedAt = 0;

export const markVerified = () => {
  verifiedAt = Date.now();
};

export const isVerified = () => Date.now() - verifiedAt < 5 * 60 * 1000;

export const clearVerified = () => {
  verifiedAt = 0;
};
