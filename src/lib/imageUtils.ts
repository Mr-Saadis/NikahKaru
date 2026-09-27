import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
  // Compression Settings
  const options = {
    maxSizeMB: 0.3, // Output image size will be max 300KB (Good for readability and size)
    maxWidthOrHeight: 1200, // Maximum dimensions (Maintains good resolution for documents)
    useWebWorker: true, // Use multi-threading for faster performance
    initialQuality: 0.8, // 80% quality is a sweet spot for compression vs quality
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    
    // Converting the output Blob back to a standard File object
    const compressedFile = new File([compressedBlob], file.name, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    });

    return compressedFile;
  } catch (error) {
    console.error("Error compressing image:", error);
    // In case of error (unlikely), return the original file to prevent breakages
    return file; 
  }
};
