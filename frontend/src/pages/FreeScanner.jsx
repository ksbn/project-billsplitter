import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

export default function FreeScanner({ onItemsExtracted }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setProgress(0);

    try {
      const { data: { text } } = await Tesseract.recognize(file, 'spa+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      parseReceiptText(text);
    } catch (err) {
      console.error('OCR Error:', err);
      alert('Error reading the image. Please try again with a clearer photo.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const parseReceiptText = (rawText) => {
    const lines = rawText.split('\n');
    const extractedItems = [];

    const ignoreKeywords = [
      'total', 'subtotal', 'iva', 'tax', 'base', 'importe',
      'efectivo', 'tarjeta', 'visa', 'mastercard', 'cambio',
      'gracias', 'atendido', 'ticket', 'factura', 'caja'
    ];

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      const lower = cleanLine.toLowerCase();
      if (ignoreKeywords.some((word) => lower.includes(word))) return;

      const match = cleanLine.match(/^(.+?)\s+[\$€]?\s*(\d+[\.,]\d{2})\s*[\$€]?$/i);

      if (match) {
        let name = match[1].trim();
        const rawPrice = match[2].replace(',', '.');
        const price = parseFloat(rawPrice);

        name = name.replace(/^(\d+\s*x?\s*)/i, '').trim();

        if (name.length > 2 && !isNaN(price) && price > 0) {
          extractedItems.push({
            name: name,
            quantity: 1,
            price: price,
          });
        }
      }
    });

    if (onItemsExtracted) {
      onItemsExtracted({ items: extractedItems });
    }
  };

  return (
    <div className="free-scanner">
      <label className="btn btn-primary btn-sm" style={{ cursor: loading ? 'wait' : 'pointer' }}>
        {loading ? `Scanning... ${progress}%` : '📷 Scan receipt'}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          disabled={loading}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  );
}