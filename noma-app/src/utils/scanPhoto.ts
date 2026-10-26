// src/utils/scanPhoto.ts
// Prepares a crop photo for diagnosis. The server rejects blurry and
// low-detail photos, so this only shrinks very large photos and never goes
// below the target size or compresses harder than JPEG 0.85.

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const TARGET_LONG_SIDE = 1280;
const JPEG_QUALITY = 0.85;

export interface PreparedPhoto {
  uri: string;
  width: number;
  height: number;
}

export async function preparePhotoForUpload(
  uri: string,
  size?: { width?: number; height?: number }
): Promise<PreparedPhoto> {
  let width = size?.width;
  let height = size?.height;

  if (!width || !height) {
    const original = await ImageManipulator.manipulate(uri).renderAsync();
    width = original.width;
    height = original.height;
  }

  const context = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > TARGET_LONG_SIDE) {
    context.resize(width >= height ? { width: TARGET_LONG_SIDE } : { height: TARGET_LONG_SIDE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}
