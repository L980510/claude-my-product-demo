package com.xjz.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class SceneRequest {

    @NotBlank(message = "场景不能为空")
    @Pattern(regexp = "personal|business", message = "场景取值非法")
    private String scene;
}
