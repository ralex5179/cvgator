package org.cvgator.template.application;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.cvgator.template.api.dto.TemplateSummaryResponse;
import org.cvgator.template.application.model.TemplateConfig;
import org.cvgator.template.application.model.TemplateDefinition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class TemplateCatalogService {

    private static final TypeReference<List<String>> REGISTERED_TEMPLATE_IDS = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    @Value("${cvgator.templates.root:templates}")
    private String templatesRoot;

    public List<TemplateSummaryResponse> listTemplates() {
        return readRegisteredTemplateIds().stream()
                .map(this::loadTemplateConfig)
                .map(config -> new TemplateSummaryResponse(
                        config.getId(),
                        config.getDisplayName(),
                        config.getDescription()))
                .toList();
    }

    public TemplateDefinition resolveTemplate(String templateId) {
        ensureTemplateRegistered(templateId);

        Path templateDir = resolveTemplateDirectory(templateId);
        TemplateConfig config = loadTemplateConfig(templateId);

        return new TemplateDefinition(
                config,
                readRequiredFile(templateDir, "template.html"),
                readRequiredFile(templateDir, "styles.css"));
    }

    private void ensureTemplateRegistered(String templateId) {
        if (!readRegisteredTemplateIds().contains(templateId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown templateId");
        }
    }

    private TemplateConfig loadTemplateConfig(String templateId) {
        try {
            return objectMapper.readValue(
                    resolveTemplateDirectory(templateId).resolve("config.json").toFile(),
                    TemplateConfig.class);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to read template config for " + templateId, exception);
        }
    }

    private List<String> readRegisteredTemplateIds() {
        try {
            return objectMapper.readValue(new ClassPathResource("templates").getInputStream(), REGISTERED_TEMPLATE_IDS);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to read template registry", exception);
        }
    }

    private Path resolveTemplateDirectory(String templateId) {
        Path rootPath = resolveTemplatesRootPath();
        Path templatePath = rootPath.resolve(templateId).normalize();

        if (!templatePath.startsWith(rootPath) || !Files.isDirectory(templatePath)) {
            throw new IllegalStateException("Template directory missing for " + templateId);
        }

        return templatePath;
    }

    private Path resolveTemplatesRootPath() {
        Path directPath = Path.of(templatesRoot).toAbsolutePath().normalize();
        if (Files.isDirectory(directPath)) {
            return directPath;
        }

        Path repoRelativePath = Path.of("..", "..", templatesRoot).toAbsolutePath().normalize();
        if (Files.isDirectory(repoRelativePath)) {
            return repoRelativePath;
        }

        throw new IllegalStateException("Templates root directory missing");
    }

    private String readRequiredFile(Path templateDir, String fileName) {
        try {
            return Files.readString(templateDir.resolve(fileName));
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to read template asset " + fileName, exception);
        }
    }
}
