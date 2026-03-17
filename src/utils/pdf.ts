import * as pdfjsLib from 'pdfjs-dist';

// Use standard CDN for the worker to avoid complex bundler configurations in Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

export async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async function() {
      try {
        const typedarray = new Uint8Array(reader.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\\n';
        }
        
        resolve(fullText.trim());
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = function() {
      reject(new Error('Failed to read PDF file.'));
    };

    reader.readAsArrayBuffer(file);
  });
}