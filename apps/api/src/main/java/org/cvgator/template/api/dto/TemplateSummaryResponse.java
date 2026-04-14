package org.cvgator.template.api.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TemplateSummaryResponse {

    private String id;

    private String displayName;

    private String description;
}
