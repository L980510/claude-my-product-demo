package com.xjz.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryRequest {

    @NotBlank(message = "分类名称不能为空")
    @Size(max = 30, message = "分类名称最长 30 字")
    private String name;

    @NotBlank(message = "类型不能为空")
    @Pattern(regexp = "expense|income", message = "类型取值非法")
    private String type;

    private String icon;

    private String color;
}
