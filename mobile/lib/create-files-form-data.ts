export type FileType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
  | 'application/pdf'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.ms-excel'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'text/plain'
  | 'video/mp4'
  | 'video/quicktime';

export interface UploadFile {
  id: string;
  uri: string;
  type: FileType;
  name?: string;
}

export function createFilesFormData<T extends UploadFile>(files: T[]): FormData {
  const formData = new FormData();

  files.forEach((file, index) => {
    formData.append(`file${index}`, {
      uri: file.uri,
      type: file.type,
      name: file.name ?? `file_${file.id}`,
    } as unknown as Blob);
  });

  return formData;
}
