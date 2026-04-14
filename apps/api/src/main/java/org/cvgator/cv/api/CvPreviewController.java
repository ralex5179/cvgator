package org.cvgator.cv.api;

import org.cvgator.cv.api.dto.CvPreviewRequest;
import org.cvgator.template.application.PdfGenerationService;
import org.cvgator.template.application.TemplateRenderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cv")
@RequiredArgsConstructor
@Slf4j
public class CvPreviewController {

    private static final String PDF_FILE_NAME = "cvgator-cv.pdf";

    private final PdfGenerationService pdfGenerationService;

    private final TemplateRenderService templateRenderService;

    @PostMapping(path = "/preview", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.TEXT_HTML_VALUE)
    public String preview(@Valid @RequestBody CvPreviewRequest request) {
        log.info("Preview requested templateId={}", request.getTemplateId());
        String html = templateRenderService.renderPreview(request);
        log.debug("Preview rendered templateId={} htmlLength={}", request.getTemplateId(), html.length());
        return html;
    }

    @PostMapping(path = "/pdf", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> exportPdf(@Valid @RequestBody CvPreviewRequest request) {
        log.info("PDF export requested templateId={}", request.getTemplateId());
        String html = templateRenderService.renderHtml(request);
        byte[] pdfBytes = pdfGenerationService.generatePdf(html);
        log.debug("PDF export generated templateId={} pdfLength={}", request.getTemplateId(), pdfBytes.length);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(PDF_FILE_NAME).build().toString())
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
