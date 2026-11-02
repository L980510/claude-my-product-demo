package com.xjz.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户账号
 */
@Data
@TableName("user")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 登录用户名，唯一 */
    private String username;

    /** 加盐哈希后的密码 */
    private String passwordHash;

    /** 场景模板：personal / business */
    private String scene;

    /** 上次使用的支出分类ID（软引用） */
    private Long lastExpenseCategoryId;

    /** 上次使用的收入分类ID（软引用） */
    private Long lastIncomeCategoryId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
