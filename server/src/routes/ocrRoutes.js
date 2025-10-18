import { Router } from "express";
import multer from "multer";
import { processReceipt } from "../controllers/ocrController.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}); // 10MB

router.post("/process", upload.single("receipt"), processReceipt);

export default router;
