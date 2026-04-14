package org.cvgator.cv.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EducationItemRequest {

    @NotBlank
    private String degree;

    @NotBlank
    private String institution;

    @NotBlank
    private String location;

    @NotBlank
    private String startDate;

    @NotBlank
    private String endDate;
}
