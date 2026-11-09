// Shrinks a photo before uploading. Phone photos can be 5+ MB, which is slow to send
// and too big for the server, so we resize to at most 1280px and save as JPEG.
const MAX_SIZE = 1280;

export function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      // `data` is the photo as base64 text (what Gemini needs); `preview` can be shown in an <img>.
      resolve({ mimeType: "image/jpeg", data: dataUrl.split(",")[1], preview: dataUrl });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file doesn't look like a photo."));
    };
    img.src = url;
  });
}
