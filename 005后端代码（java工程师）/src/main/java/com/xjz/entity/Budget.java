package com.xjz.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 月度预算
 */
@Data
@TableName("budget")
public class Budget {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    /** 月份，格式 YYYY-MM */
    private String month;

    /** 预算金额，单位：分 */
    private Long amount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
