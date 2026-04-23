const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

const MAX_BYTES = 32 * 1024 * 1024; // ImgBB free tier

export async function uploadImage(file, name) {
  if (!file) throw new Error('請先選擇圖片');
  if (!file.type?.startsWith('image/')) {
    throw new Error('檔案格式不支援（僅支援圖片）');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('圖片太大（上限 32 MB）');
  }
  if (!IMGBB_API_KEY) {
    throw new Error('ImgBB API key 未設定');
  }

  const formData = new FormData();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', file);
  if (name) formData.append('name', name);

  const res = await fetch(IMGBB_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('ImgBB 回應無法解析');
  }

  if (!data?.success) {
    throw new Error(data?.error?.message || 'ImgBB 上傳失敗');
  }
  return data.data.url;
}

export const uploadProfileImage = (userId, file) =>
  uploadImage(file, `profile_${userId}_${Date.now()}`);

export const uploadMessageImage = (chatroomId, file) =>
  uploadImage(file, `msg_${chatroomId}_${Date.now()}`);
