/**
 * PDF Exporter for Contrast Checker
 * Creates a PDF document with contrast accessibility data.
 *
 * Uses html-to-image to capture the canvas as a PNG, then embeds it in
 * a properly structured PDF with the serialized state included as metadata.
 */

import type { Exporter } from "@itsjust/core";

export const exporter: Exporter = {
  format: "pdf",
  export: async (element, options, stateSerializer) => {
    try {
      const { toPng } = await import("html-to-image");
      const pngDataUrl = await toPng(element, {
        width: element.offsetWidth,
        height: element.offsetHeight,
        quality: 0.95,
        backgroundColor: "#ffffff",
        ...(options?.padding && { padding: options.padding }),
      });

      const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, "");
      const binaryStr = atob(base64Data);

      const title = "Contrast Checker Report";
      const serializer = stateSerializer?.() || "{}";

      const pdfWidth = 595.28;
      const pdfHeight = 841.89;
      const margin = 40;
      const maxImgWidth = pdfWidth - 2 * margin;
      const maxImgHeight = pdfHeight - 2 * margin - 60;
      const imgWidth = element.offsetWidth;
      const imgHeight = element.offsetHeight;
      const scale = Math.min(
        maxImgWidth / imgWidth,
        maxImgHeight / imgHeight,
        1,
      );
      const displayW = Math.round(imgWidth * scale);
      const displayH = Math.round(imgHeight * scale);
      const imgX = Math.round((pdfWidth - displayW) / 2);
      const imgY = Math.round(pdfHeight - margin - displayH);

      const objects: string[] = [];
      let objNum = 1;

      objects.push(`${objNum} 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj`);
      objNum++;

      objects.push(`${objNum} 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj`);
      objNum++;

      const contentObjNum = objNum + 1;
      const xobjectObjNum = objNum + 2;

      const streamContent = `q
BT
/F1 20 Tf
${margin} ${pdfHeight - margin - 24} Td
(${title}) Tj
ET
Q
${imgX} ${imgY} ${displayW} ${displayH} re
W n
q
${imgX} ${imgY} ${displayW} ${displayH} cm
/Img1 Do
Q`;

      objects.push(`3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidth} ${pdfHeight}] /Contents ${contentObjNum} 0 R /Resources << /Font << /F1 5 0 R >> /XObject << /Img1 ${xobjectObjNum} 0 R >> >> >>
endobj`);
      objNum++;

      objects.push(`4 0 obj
<< /Length ${streamContent.length} >>
stream
${streamContent}
endstream
endobj`);
      objNum++;

      const streamLen = binaryStr.length;
      objects.push(`5 0 obj
<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length ${streamLen} /Filter /ASCII85Decode >>
stream
${toAscii85(binaryStr)}
~>
endstream
endobj`);
      objNum++;

      objects.push(`6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj`);

      const xrefEntries = objects.length + 1;

      let xref = `xref\n0 ${xrefEntries}\n0000000000 65535 f \n`;
      let pos = 0;
      for (let i = 0; i < objects.length; i++) {
        const objStr = objects[i];
        xref += `${String(pos).padStart(10, "0")} 00000 n \n`;
        pos += objStr.length + 1;
      }

      const pdf = `%PDF-1.4
${objects.join("\n")}
${xref}
trailer
<< /Size ${xrefEntries} /Root 1 0 R >>
startxref
${pos}
%%EOF`;

      const blob = new Blob([pdf], { type: "application/pdf" });

      return {
        success: true,
        data: blob,
        filename:
          options?.filename ?? `contrast-check-report-${Date.now()}.pdf`,
        format: "pdf",
      };
    } catch (error) {
      console.error("[PDF Exporter]", error);
      return {
        success: false,
        data: null,
        filename: options?.filename ?? `contrast-check-report-${Date.now()}`,
        format: "pdf",
        error: error instanceof Error ? error.message : "PDF export failed",
      };
    }
  },
};

export default exporter;

function toAscii85(data: string): string {
  let result = "";
  let i = 0;
  while (i < data.length) {
    const b1 = data.charCodeAt(i) & 0xff;
    const b2 = data.charCodeAt(i + 1) & 0xff;
    const b3 = data.charCodeAt(i + 2) & 0xff;
    const b4 = data.charCodeAt(i + 3) & 0xff;
    i += 4;

    if (b1 === 0 && b2 === 0 && b3 === 0 && b4 === 0) {
      result += "z";
      continue;
    }

    const val = (b1 << 24) | (b2 << 16) | (b3 << 8) | b4;
    const c1 = Math.floor(val / 85 ** 4) % 85;
    const c2 = Math.floor(val / 85 ** 3) % 85;
    const c3 = Math.floor(val / 85 ** 2) % 85;
    const c4 = Math.floor(val / 85) % 85;
    const c5 = val % 85;

    result += String.fromCharCode(c1 + 33, c2 + 33, c3 + 33, c4 + 33, c5 + 33);
  }

  return result;
}
