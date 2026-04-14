package org.cvgator.template.application;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.stereotype.Service;

@Service
public class PdfGenerationService {

    public byte[] generatePdf(String html) {
        String normalizedHtml = html.trim().replaceFirst("(?i)<!doctype html>", "<!DOCTYPE html>");

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(normalizedHtml, null);
            builder.toStream(outputStream);
            builder.run();
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to write generated PDF", exception);
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to generate PDF", exception);
        }
    }
}
