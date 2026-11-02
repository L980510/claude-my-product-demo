package com.xjz.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 收支记录
 */
@Data
@TableName("record")
public class Record {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    /** expense / income */
    private String type;

    /** 金额，单位：分 */
    private Long amount;

    private Long categoryId;

    /** 备注 */
    private String note;

    /** 记账日期（JSON 字段名 date，与前端一致） */
    @JsonProperty("date")
    private LocalDate recordDate;

    /** 账本ID（预留，可空） */
    private Long bookId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
