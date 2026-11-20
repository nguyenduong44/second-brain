// Prompt trích xuất cho Vision Model qua OmniRoute.
// Ảnh gốc không bao giờ gửi kèm secret; chỉ gửi ảnh + prompt dưới đây.
export const VISION_PROMPT = [
  "Bức ảnh này chụp cái gì? Bối cảnh đời sống / công việc liên quan là gì?",
  "Trích xuất toàn bộ text / số liệu quan trọng trong ảnh (OCR hóa đơn, thông số kỹ thuật, ghi chú).",
  "Gợi ý gắn thẻ và liên kết với các trang đang có trong wiki/index.md.",
  "Trả lời bằng tiếng Việt, ngắn gọn, theo dạng: Mô tả / Text trích xuất / Thẻ gợi ý / Liên kết gợi ý.",
  "Nếu ảnh chứa CCCD hoặc giấy tờ tùy thân, chỉ trả lời: 'Ảnh chứa giấy tờ nhạy cảm, không phân tích.'",
].join("\n");

export function buildPhotoAnalysisMd(opts: {
  slug: string;
  originalRelPath: string;
  analysis: string;
  date: string;
}): string {
  return [
    `# Ảnh — ${opts.slug}`,
    "",
    `![gốc](../../${opts.originalRelPath})`,
    "",
    `Ngày phân tích: ${opts.date}`,
    "",
    "## Phân tích",
    "",
    opts.analysis,
    "",
  ].join("\n");
}
