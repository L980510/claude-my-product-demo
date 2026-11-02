package com.xjz.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RecordRequest {

    @NotBlank(message = "类型不能为空")
    @Pattern(regexp = "expense|income", message = "类型取值非法")
    private String type;

    @NotNull(message = "金额不能为空")
    @Min(value = 1, message = "金额必须大于 0")
    @Max(value = 999999999, message = "金额超出上限")
    private Long amount;

    @NotNull(message = "分类不能为空")
    private Long categoryId;

    @Size(max = 50, message = "备注最长 50 字")
    private String note;

    @NotBlank(message = "日期不能为空")
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "日期格式应为 YYYY-MM-DD")
    private String date;
}
