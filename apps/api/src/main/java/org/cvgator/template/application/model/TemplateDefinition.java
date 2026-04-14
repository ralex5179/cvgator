package org.cvgator.template.application.model;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TemplateDefinition {

    private TemplateConfig config;

    private String templateHtml;

    private String stylesCss;
}
