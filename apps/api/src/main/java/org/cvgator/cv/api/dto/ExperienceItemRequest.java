package org.cvgator.cv.api.dto;

import java.util.ArrayList;
import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ExperienceItemRequest {

    @NotBlank
    private String role;

    @NotBlank
    private String company;

    @NotBlank
    private String location;

    @NotBlank
    private String startDate;

    @NotBlank
    private String endDate;

    @NotNull
    private List<String> highlights = new ArrayList<>();
}
