package com.xjz.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 收支分类
 */
@Data
@TableName("category")
public class Category {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    /** 分类名称 */
    private String name;

    /** expense / income */
    private String type;

    /** 图标（emoji 或字符） */
    private String icon;

    /** 颜色 */
    private String color;

    /** 排序（JSON 字段名 sort，与前端一致） */
    @JsonProperty("sort")
    private Integer sortOrder;

    /** 是否系统预置分类 */
    @JsonProperty("isSystem")
    private Boolean isSystem;

    /** 场景模板：personal / business；自定义分类为 null */
    private String scene;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
