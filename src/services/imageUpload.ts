import * as ImagePicker from 'expo-image-picker';

import { apiBaseUrl } from '@/services/apiClient';
import { hydrateAuthSession, setAuthSession } from '@/services/tokenStorage';
import { normalizeAuthRole } from '@/utils/auth';

type UploadResponse = {
  ok: boolean;
  data: {
    url: string;
    filename: string;
  };
};

const fetchWithTimeout = async (request: RequestInfo | URL, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(request, {
      ...init,
      signal: controller.signal
    });
  } catch (error: any) {
    if (controller.signal.aborted) {
      throw new Error('Upload timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

export const pickAndUploadImage = async () => {
  let session = await hydrateAuthSession();
  if (!session?.token) {
    throw new Error('Please sign in first');
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Media library permission is required to upload images');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
    allowsEditing: false
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  const doUpload = async (nextSession: NonNullable<typeof session>) => {
    const formData = new FormData();
    formData.append('image', {
      uri: asset.uri,
      name: asset.fileName ?? `upload-${Date.now()}.jpg`,
      type: asset.mimeType ?? 'image/jpeg'
    } as any);

    const response = await fetchWithTimeout(
      `${apiBaseUrl.replace(/\/$/, '')}/uploads/image`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${nextSession.token}`
        },
        body: formData
      },
      30000
    );

    const raw = await response.text();
    let parsed: any = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = raw;
      }
    }

    if (!response.ok) {
      throw Object.assign(
        new Error(parsed?.message ?? `Request failed with status ${response.status}`),
        {
          status: response.status,
          data: parsed
        }
      );
    }

    return parsed as UploadResponse;
  };

  try {
    const response = await doUpload(session);
    return response.data.url;
  } catch (error: any) {
    if (error?.status !== 401 || !session.refreshToken) {
      throw error;
    }

    const refreshResponse = await fetchWithTimeout(
      `${apiBaseUrl.replace(/\/$/, '')}/auth/refresh`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: session.refreshToken })
      },
      15000
    );

    const refreshText = await refreshResponse.text();
    let refreshData: any = null;
    if (refreshText) {
      try {
        refreshData = JSON.parse(refreshText);
      } catch {
        refreshData = refreshText;
      }
    }

    if (!refreshResponse.ok || !refreshData?.data?.token) {
      throw error;
    }

    session = {
      token: refreshData.data.token,
      refreshToken: refreshData.data.refreshToken ?? session.refreshToken,
      phone: refreshData.data.user?.phone ?? session.phone ?? null,
      role: normalizeAuthRole(refreshData.data.user?.role ?? session.role ?? 'shopper')
    };
    await setAuthSession(session);

    const retried = await doUpload(session);
    return retried.data.url;
  }
};
