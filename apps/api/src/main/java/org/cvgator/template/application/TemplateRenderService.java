package org.cvgator.template.application;

import java.util.Map;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.cvgator.cv.api.dto.CvPreviewRequest;
import org.cvgator.template.application.model.TemplateDefinition;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TemplateRenderService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    private final TemplateCatalogService templateCatalogService;

    private final TemplateRenderer templateRenderer;

    public String renderPreview(CvPreviewRequest request) {
        return renderHtml(request);
    }

    public String renderHtml(CvPreviewRequest request) {
        TemplateDefinition templateDefinition = templateCatalogService.resolveTemplate(request.getTemplateId());
        Map<String, Object> model = objectMapper.convertValue(request, MAP_TYPE);
        String body = templateRenderer.render(templateDefinition.getTemplateHtml(), model);

        return body.replace(
                "<link rel=\"stylesheet\" href=\"styles.css\" />",
                "<style>\n" + templateDefinition.getStylesCss() + "\n</style>");
    }
}
