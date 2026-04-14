package org.cvgator.cv.api.dto;

import java.util.ArrayList;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CvPreviewRequest {

    @NotBlank
    private String templateId;

    @Valid
    @NotNull
    private PersonalDetailsRequest personal;

    @Valid
    @NotNull
    private List<ExperienceItemRequest> experience = new ArrayList<>();

    @Valid
    @NotNull
    private List<EducationItemRequest> education = new ArrayList<>();

    @Valid
    @NotNull
    private List<SkillItemRequest> skills = new ArrayList<>();
}
