import OCRService from "../services/ocrService.js";
import prisma from "../lib/prisma.js";

export const processReceipt = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { buffer, originalname } = req.file;

    // Call OCR service
    const result = await OCRService.extractReceiptData(buffer, originalname);

    if (!result.success) {
      return res.status(500).json({ error: result.error || "OCR failed" });
    }

    // Example: save receipt and OCR in DB
    const expenseCandidate = OCRService.parseReceiptToExpense(result.data);

    // Create Expense (DRAFT) and Receipt record
    const expense = await prisma.expense.create({
      data: {
        companyId: req.body.companyId || "replace-with-company-id", // adapt to your auth flow
        createdById: req.body.createdById || "replace-with-user-id",
        title: expenseCandidate.title,
        description: expenseCandidate.description,
        amountOriginal: expenseCandidate.amountOriginal,
        currencyOriginal: expenseCandidate.currencyOriginal,
        dateOfExpense: expenseCandidate.dateOfExpense,
        status: "DRAFT",
      },
    });

    const receipt = await prisma.receipt.create({
      data: {
        expenseId: expense.id,
        url: null, // if you upload to GCS, store URL here
        ocrExtract: result.data, // store structured OCR JSON
      },
    });

    return res.json({ success: true, expense, receipt, ocr: result.data });
  } catch (err) {
    console.error("processReceipt error:", err);
    return res.status(500).json({ error: err.message });
  }
};
