package org.cvgator.template.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.cvgator.template.api.dto.TemplateSummaryResponse;
import org.cvgator.template.application.model.TemplateDefinition;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
class TemplateCatalogServiceTest {

    @Autowired
    private TemplateCatalogService templateCatalogService;

    @Test
    void listsRegisteredTemplatesFromBackendRegistry() {
        List<TemplateSummaryResponse> templates = templateCatalogService.listTemplates();

        assertThat(templates).hasSize(1);
        assertThat(templates.getFirst().getId()).isEqualTo("default");
        assertThat(templates.getFirst().getDisplayName()).isEqualTo("Default");
    }

    @Test
    void resolvesRegisteredTemplateAssets() {
        TemplateDefinition templateDefinition = templateCatalogService.resolveTemplate("default");

        assertThat(templateDefinition.getConfig().getVersion()).isEqualTo("1.0.0");
        assertThat(templateDefinition.getTemplateHtml()).contains("{{personal.fullName}}");
        assertThat(templateDefinition.getStylesCss()).contains(".cv-document");
    }

    @Test
    void rejectsUnknownTemplateId() {
        assertThatThrownBy(() -> templateCatalogService.resolveTemplate("missing"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404 NOT_FOUND");
    }
}
