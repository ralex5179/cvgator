package org.cvgator.template.api;

import java.util.List;
import org.cvgator.template.api.dto.TemplateSummaryResponse;
import org.cvgator.template.application.TemplateCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateCatalogService templateCatalogService;

    @GetMapping
    public List<TemplateSummaryResponse> listTemplates() {
        return templateCatalogService.listTemplates();
    }
}
