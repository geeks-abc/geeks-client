import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE } from './config';

let authToken: string | null = null;
export const setToken = (token: string | null) => (authToken = token);

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; formData?: FormData } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}/api${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
  });

  if (!res.ok) {
    let message = `요청 실패 (${res.status})`;
    try {
      const data = await res.json();
      message = Array.isArray(data.message) ? data.message[0] : (data.message ?? message);
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

// ── 타입 (서버 응답 기준) ──────────────────────────────
export type Role = 'STORE' | 'FACILITY' | 'ADMIN';
export type ListingStatus = 'OPEN' | 'MATCHED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

export interface Store {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
}
export interface Facility {
  id: number;
  name: string;
  type: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
}
export interface Listing {
  id: number;
  storeId: number;
  itemName: string;
  quantity: number;
  photoUrl?: string | null;
  pickupStart: string;
  pickupEnd: string;
  status: ListingStatus;
  createdAt: string;
  store?: Store;
  match?: Match | null;
}
export interface FeedItem extends Listing {
  store: Store;
  distanceKm: number;
  remainingMinutes: number;
}
export interface Match {
  id: number;
  listingId: number;
  facilityId: number;
  qrToken: string;
  matchedAt: string;
  listing?: Listing & { store: Store };
  facility?: Facility;
}
export interface Donation {
  id: number;
  matchId: number;
  completedAt: string;
  weightKg: number;
  certificateUrl?: string | null;
  match: Match & { listing: Listing & { store: Store }; facility: Facility };
}
export interface AuthUser {
  sub: number;
  email: string;
  role: Role;
  storeId: number | null;
  facilityId: number | null;
}
export interface Me {
  id: number;
  email: string;
  role: Role;
  storeId: number | null;
  facilityId: number | null;
  store: Store | null;
  facility: Facility | null;
}
export interface Impact {
  totalDonations: number;
  totalWeightKg: number;
  totalCo2eKg: number;
  storeCount: number;
  facilityCount: number;
  daily: { date: string; count: number; weightKg: number; co2eKg?: number }[];
}
export interface Notice {
  id: number;
  recipientType: 'STORE' | 'FACILITY';
  recipientId: number;
  type: string;
  payload: Record<string, any>;
  read: boolean;
  createdAt: string;
}

// ── 엔드포인트 ────────────────────────────────────────
export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  me: () => request<Me>('/auth/me'),

  myListings: (storeId: number) => request<Listing[]>(`/listings?storeId=${storeId}`),
  listing: (id: number) => request<Listing>(`/listings/${id}`),
  createListing: (body: {
    storeId: number;
    itemName: string;
    quantity: number;
    photoUrl?: string;
    pickupStart: string;
    pickupEnd: string;
  }) => request<Listing>('/listings', { method: 'POST', body }),
  cancelListing: (id: number) => request<Listing>(`/listings/${id}/cancel`, { method: 'POST' }),
  feed: (facilityId: number, radiusKm = 3) =>
    request<FeedItem[]>(`/listings/feed?facilityId=${facilityId}&radiusKm=${radiusKm}`),

  applyMatch: (listingId: number, facilityId: number) =>
    request<Match>('/matches', { method: 'POST', body: { listingId, facilityId } }),
  match: (id: number) => request<Match>(`/matches/${id}`),
  facilityMatches: (facilityId: number, status?: ListingStatus) =>
    request<Match[]>(`/matches?facilityId=${facilityId}${status ? `&status=${status}` : ''}`),
  completeMatch: (id: number, qrToken: string) =>
    request<{
      donation: { id: number; completedAt: string; weightKg: number };
      itemName: string;
      quantity: number;
      storeName: string;
      facilityName: string;
    }>(`/matches/${id}/complete`, { method: 'POST', body: { qrToken } }),
  cancelMatch: (id: number) => request<{ ok: boolean }>(`/matches/${id}/cancel`, { method: 'POST' }),

  donations: (filter: { storeId?: number; facilityId?: number }) =>
    request<Donation[]>(
      `/donations?${filter.storeId ? `storeId=${filter.storeId}` : `facilityId=${filter.facilityId}`}`,
    ),
  certificate: (donationId: number) =>
    request<{
      serialNumber: string;
      donor: { name: string; address: string };
      beneficiary: { name: string; type: string };
      itemName: string;
      quantity: number;
      weightKg: number;
      completedAt: string;
    }>(`/donations/${donationId}/certificate`),
  certificatePdfUrl: (donationId: number) => `${API_BASE}/api/donations/${donationId}/certificate.pdf`,

  impact: () => request<Impact>('/dashboard/impact'),

  notifications: (recipientType: 'STORE' | 'FACILITY', recipientId: number) =>
    request<Notice[]>(`/notifications?recipientType=${recipientType}&recipientId=${recipientId}`),
  unreadCount: (recipientType: 'STORE' | 'FACILITY', recipientId: number) =>
    request<{ count: number }>(
      `/notifications/unread-count?recipientType=${recipientType}&recipientId=${recipientId}`,
    ),
  readAll: (recipientType: 'STORE' | 'FACILITY', recipientId: number) =>
    request<{ ok: boolean }>(
      `/notifications/read-all?recipientType=${recipientType}&recipientId=${recipientId}`,
      { method: 'PATCH' },
    ),

  // RN fetch+FormData는 파일이 누락되는 케이스가 있어 FileSystem.uploadAsync 사용
  upload: async (uri: string): Promise<{ url: string }> => {
    const result = await FileSystem.uploadAsync(`${API_BASE}/api/uploads`, uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    let data: any = null;
    try {
      data = JSON.parse(result.body);
    } catch {
      /* ignore */
    }
    if (result.status < 200 || result.status >= 300) {
      throw new ApiError(result.status, data?.message ?? `업로드 실패 (${result.status})`);
    }
    return data as { url: string };
  },
};
