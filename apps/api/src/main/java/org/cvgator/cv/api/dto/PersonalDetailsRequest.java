package org.cvgator.cv.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PersonalDetailsRequest {

    @NotBlank
    private String fullName;

    @NotBlank
    private String title;

    @NotBlank
    private String email;

    @NotBlank
    private String phone;

    @NotBlank
    private String location;

    private String summary;
}
