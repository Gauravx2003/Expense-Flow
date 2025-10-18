// services/ocrService.js
import { ImageAnnotatorClient } from "@google-cloud/vision";

/**
 * Make sure GOOGLE_APPLICATION_CREDENTIALS env var points to your JSON key file.
 * npm i @google-cloud/vision
 */

const client = new ImageAnnotatorClient(); // uses GOOGLE_APPLICATION_CREDENTIALS

class OCRService {
  /**
   * Extract data from image buffer using Google Vision
   * @param {Buffer} imageBuffer
   * @param {string} filename
   */
  static async extractReceiptData(imageBuffer, filename) {
    try {
      // Prefer documentTextDetection for receipts (better layout parsing)
      const [result] = await client.documentTextDetection({
        image: { content: imageBuffer },
      });

      const doc = result.fullTextAnnotation || {};
      const rawText = doc.text || "";

      // basic parsed text blocks
      const pages = doc.pages || [];
      // You can dive into pages/blocks/parars for structured layout if needed

      // Run some heuristics to extract merchant, total, date
      const merchant = OCRService.extractMerchantFromText(rawText);
      const total = OCRService.extractTotalFromText(rawText);
      const date = OCRService.extractDateFromText(rawText);

      const currency = OCRService.extractCurrencyFromText(rawText) || "USD";

      const items = OCRService.extractLineItems(rawText);

      return {
        success: true,
        data: {
          merchant,
          date,
          total,
          currency,
          items,
          rawText,
          confidence: OCRService.computeConfidence(result),
        },
      };
    } catch (error) {
      console.error("OCRService.extractReceiptData error:", error);
      return { success: false, error: error.message };
    }
  }

  static computeConfidence(result) {
    // try to derive a confidence score from blocks/pages if present
    try {
      const pages = result.fullTextAnnotation?.pages || [];
      if (!pages.length) return null;
      // average of paragraph confidences if available
      let sum = 0;
      let count = 0;
      pages.forEach((p) => {
        p.blocks?.forEach((b) => {
          b.paragraphs?.forEach((para) => {
            if (typeof para.confidence === "number") {
              sum += para.confidence;
              count++;
            }
          });
        });
      });
      return count ? sum / count : null;
    } catch {
      return null;
    }
  }

  // Heuristic: merchant is often first non-empty line
  static extractMerchantFromText(text) {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length) {
      // Skip generic headers like "RECEIPT", "INVOICE"
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        const l = lines[i];
        if (
          !/receipt|invoice|tax|total/i.test(l) &&
          l.length > 2 &&
          l.length < 40
        ) {
          return l;
        }
      }
      return lines[0];
    }
    return null;
  }

  // Heuristic: find line containing "total" or last monetary amount
  static extractTotalFromText(text) {
    // find lines with total or last $ amount
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    // try to find "total" lines
    for (let i = lines.length - 1; i >= 0; i--) {
      const l = lines[i].toLowerCase();
      if (/(grand total|total|amount due)/i.test(l)) {
        const val = OCRService.findFirstCurrencyInString(lines[i]);
        if (val) return val;
      }
    }
    // fallback: find last currency-like number in text
    const allMatches = [
      ...text.matchAll(/(?:\$|USD|\b)(\s*[\d,]+(?:\.\d{1,2})?)/gi),
    ];
    if (allMatches.length) {
      const m = allMatches[allMatches.length - 1][1];
      return m.replace(/[,\s]/g, "");
    }
    return null;
  }

  static findFirstCurrencyInString(str) {
    const m = str.match(/([$€£]?)(\d{1,3}(?:[,.\s]\d{3})*(?:[.,]\d{1,2})?)/);
    return m ? m[2].replace(/[,\s]/g, "").replace(",", ".") : null;
  }

  // Simple date detection
  static extractDateFromText(text) {
    // captures formats like YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD Mon YYYY etc.
    const dateRegexes = [
      /\b(\d{4}-\d{2}-\d{2})\b/,
      /\b(\d{2}\/\d{2}\/\d{4})\b/,
      /\b(\d{2}\.\d{2}\.\d{4})\b/,
      /\b(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*)\b/i,
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s*\d{4}\b/i,
    ];
    for (const r of dateRegexes) {
      const m = text.match(r);
      if (m) return m[1] || m[0];
    }
    return null;
  }

  static extractCurrencyFromText(text) {
    const m = text.match(/\b(USD|EUR|GBP|INR|AUD|CAD)\b/i);
    return m ? m[1].toUpperCase() : null;
  }

  // Very naive line items splitter — improve for production
  static extractLineItems(text) {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const items = [];
    for (const line of lines) {
      const m = line.match(/(.+)\s+([€£$]\s?\d+(?:[.,]\d{1,2})?)$/);
      if (m)
        items.push({
          description: m[1].trim(),
          amount: m[2].replace(/[€,£$\s]/g, ""),
        });
    }
    return items;
  }

  static validateReceiptData(receiptData) {
    const errors = [];
    if (!receiptData.merchant) errors.push("Merchant not found");
    if (!receiptData.total) errors.push("Total not found");
    return { isValid: errors.length === 0, errors };
  }

  static parseReceiptToExpense(receiptData) {
    return {
      title: receiptData.merchant
        ? `Receipt - ${receiptData.merchant}`
        : "Receipt",
      description: receiptData.rawText,
      amountOriginal: receiptData.total ? parseFloat(receiptData.total) : 0,
      currencyOriginal: receiptData.currency || "USD",
      dateOfExpense: receiptData.date ? new Date(receiptData.date) : new Date(),
      category: "misc",
      merchant: receiptData.merchant,
      items: receiptData.items || [],
    };
  }
}

export default OCRService;
