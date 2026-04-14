package org.cvgator.template.application.model;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class TemplateConfig {

    private String id;

    private String displayName;

    private String description;

    private String version;
}
