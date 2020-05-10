import { Injectable } from '@angular/core';
import { CameraPhoto, CameraResultType, CameraSource, Capacitor, FilesystemDirectory, Plugins } from '@capacitor/core';
import { Document } from '../domain/document';
import { Platform } from '@ionic/angular';

const { Camera, Filesystem, Storage } = Plugins;

@Injectable({
  providedIn: 'root'
})

export class ScanService {
  public documents: Document[] = [];
  private DOCUMENT_STORAGE: 'documents';
  private platform: Platform;

  constructor( platform: Platform) {
    this.platform = platform;
  }

  public async loadSaved() {
    // Retrieve cached photo array data
    const documents = await Storage.get({key: this.DOCUMENT_STORAGE});
    this.documents = JSON.parse(documents.value) || [];

    // Easiest way to detect when running on the web:
    // "when the platform is NOT hybrid, do this"
    if (!this.platform.is('hybrid')) {
      // Display the photo by reading into base 64 format
      for (const document of this.documents) {
        // Read each saved photo's data from the Filesystem
        const readFile = await Filesystem.readFile({
          path: document.filePath,
          directory: FilesystemDirectory.Data
        });

        // Web platform only: Save the phtoto in the base64 field
        document.base64 = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
  }

  public async addNewToGallery() {
    // Take a photo
    try {
      const capturedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.Uri, // file-based data; provides best performance
        source: CameraSource.Camera, // automatically take a new photo with the camera
        quality: 50 // quality (0 to 100)
      });

      const savedImageFile = await this.savePicture(capturedPhoto);

      // Add new document
      this.documents.unshift(savedImageFile);

      // Cache all photo data for future retrieval
      Storage.set({
        key: this.DOCUMENT_STORAGE,
        value: this.platform.is('hybrid')
            ? JSON.stringify(this.documents)
            : JSON.stringify(this.documents.map(d => {
              // Don't save the base64 of the photo data
              // since it's already saved on the Filesystem
              const documentCopy = { ...d };
              delete documentCopy.base64;
              return documentCopy;
            }))
      });
    } catch (e) {
      console.log('no photo taken', e);
    }
  }

  private async savePicture(cameraPhoto: CameraPhoto) {
    // Convert photo to base64 format, required by Filesystem API to save
    const base64data = await this.readAsBase64(cameraPhoto);

    // Write the file to the data directory
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64data,
      directory: FilesystemDirectory.Data
    });

    if (this.platform.is('hybrid')) {
      // Display the new image by rewriting the 'file://' path to HTTP
      // Details: https://ionicframework.com/docs/building/webviewfile-protocol
      return {
        filePath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri)
      };
    } else {
      // Use webPath to display the new image insted of base64 since it's already
      // loaded into memory
      return {
        filePath: fileName,
        webviewPath: cameraPhoto.webPath
      };
    }
  }

  private async readAsBase64(cameraPhoto: CameraPhoto) {
    // "hybrid" will detect Cordova or Capacitor
    if (this.platform.is('hybrid')) {
      // Read the file into base64
      try {
        const file = await Filesystem.readFile({
          path: cameraPhoto.path
        });

        return file.data;
      } finally {
        console.log('finally');
      }
    } else {
      // on web, fetch the photo, read as blob, then convert to base64 format
      const response = await fetch(cameraPhoto.webPath);
      const blog = await response.blob();

      return await this.convertBlogToBase64(blog) as string;
    }
  }

  private async convertBlogToBase64(blob: Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  }
}
