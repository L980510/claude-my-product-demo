-- =============================================================
--  消费记账（xjz）· 数据库初始化脚本（DDL）
--  -----------------------------------------------------------
--  依据      ：产品需求文档（PRD）v1.3 第 6 章「数据需求」
--  目标库    ：MySQL 8.x（本项目已在 Docker 部署 MySQL 8.4）
--  字符集    ：utf8mb4（分类图标为 emoji，必须用 utf8mb4）
--  金额约定  ：一律以「分」为整数存储（INT UNSIGNED），避免浮点误差
--  密码约定  ：仅存加盐哈希（bcrypt / argon2），绝不存明文
--
--  ⚠️ 注意：本脚本包含 DROP TABLE IF EXISTS，会删除同名表及其数据，
--     请仅在「新建 / 重建」环境下执行，勿对已有生产数据直接运行。
--
--  执行方式（Docker MySQL 8.4，容器名 mysql8）：
--     docker exec -i mysql8 mysql -uroot -p123456 < schema.sql
-- =============================================================

SET NAMES utf8mb4;

-- -------------------------------------------------------------
-- 1. 创建数据库
-- -------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `xjz`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE `xjz`;

-- -------------------------------------------------------------
-- 2. 按外键依赖倒序 DROP（便于脚本重复执行）
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `budget`;
DROP TABLE IF EXISTS `record`;
DROP TABLE IF EXISTS `book`;
DROP TABLE IF EXISTS `category`;
DROP TABLE IF EXISTS `user`;

-- =============================================================
-- 3. 用户账号表 user
-- =============================================================
CREATE TABLE `user` (
  `id`                        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username`                  VARCHAR(20)     NOT NULL                COMMENT '用户名：3-20位字母/数字/下划线，全局唯一',
  `password_hash`             VARCHAR(255)    NOT NULL                COMMENT '密码哈希（加盐，bcrypt/argon2），绝不存明文',
  `scene`                     ENUM('personal','business') NULL DEFAULT NULL COMMENT '场景模板：personal=个人/家庭，business=经营/个体户；首次引导后写入',
  `last_expense_category_id`  BIGINT UNSIGNED NULL                    COMMENT '上次使用的支出分类ID（软引用，非外键，分类删除后置空）',
  `last_income_category_id`   BIGINT UNSIGNED NULL                    COMMENT '上次使用的收入分类ID（软引用，非外键）',
  `created_at`                DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `updated_at`                DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户账号表';

-- =============================================================
-- 4. 分类表 category
-- =============================================================
CREATE TABLE `category` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `user_id`     BIGINT UNSIGNED NOT NULL                COMMENT '所属用户ID（数据隔离依据）',
  `name`        VARCHAR(30)     NOT NULL                COMMENT '分类名称',
  `type`        ENUM('expense','income') NOT NULL       COMMENT '类型：expense=支出，income=收入',
  `icon`        VARCHAR(32)     NULL                    COMMENT '图标（emoji，UTF-8 多字节）',
  `color`       VARCHAR(7)      NULL                    COMMENT '颜色（#RRGGBB）',
  `sort_order`  INT             NOT NULL DEFAULT 0      COMMENT '排序权重（越小越靠前）',
  `is_system`   TINYINT(1)      NOT NULL DEFAULT 0      COMMENT '是否预设分类：1=预设，0=用户自定义',
  `scene`       ENUM('personal','business') NULL DEFAULT NULL COMMENT '来源模板：personal/business；用户自定义分类可为NULL',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_type` (`user_id`, `type`),
  CONSTRAINT `fk_category_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='分类表';

-- =============================================================
-- 5. 账本表 book（P2 多账本预留，V1 不启用）
-- =============================================================
CREATE TABLE `book` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '账本ID',
  `user_id`     BIGINT UNSIGNED NOT NULL                COMMENT '所属用户ID',
  `name`        VARCHAR(30)     NOT NULL                COMMENT '账本名称',
  `type`        ENUM('personal','family','business') NULL DEFAULT NULL COMMENT '账本类型（预留）：personal=个人，family=家庭，business=经营',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_book_user` (`user_id`),
  CONSTRAINT `fk_book_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='账本表（P2 多账本预留，V1 仅单账本）';

-- =============================================================
-- 6. 账单流水表 record
-- =============================================================
CREATE TABLE `record` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '流水ID',
  `user_id`      BIGINT UNSIGNED NOT NULL                COMMENT '所属用户ID（数据隔离依据）',
  `type`         ENUM('expense','income') NOT NULL       COMMENT '类型：expense=支出，income=收入',
  `amount`       INT UNSIGNED    NOT NULL                COMMENT '金额，单位：分（整数存储避免浮点误差，>0）',
  `category_id`  BIGINT UNSIGNED NOT NULL                COMMENT '分类ID',
  `note`         VARCHAR(50)     NULL                    COMMENT '备注，最长50字',
  `record_date`  DATE            NOT NULL                COMMENT '记账日期（YYYY-MM-DD，可回选）',
  `book_id`      BIGINT UNSIGNED NULL                    COMMENT '账本ID（P2 预留，当前为NULL表示默认主账本）',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间（同日排序用）',
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_record_user_date` (`user_id`, `record_date` DESC),
  KEY `idx_record_user_category` (`user_id`, `category_id`),
  CONSTRAINT `chk_record_amount` CHECK (`amount` > 0),
  CONSTRAINT `fk_record_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_record_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_record_book` FOREIGN KEY (`book_id`) REFERENCES `book` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='账单流水表';

-- =============================================================
-- 7. 月度预算表 budget
-- =============================================================
CREATE TABLE `budget` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '预算ID',
  `user_id`     BIGINT UNSIGNED NOT NULL                COMMENT '所属用户ID',
  `month`       CHAR(7)         NOT NULL                COMMENT '月份（YYYY-MM）',
  `amount`      INT UNSIGNED    NOT NULL                COMMENT '预算金额，单位：分（>0）',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_budget_user_month` (`user_id`, `month`),
  CONSTRAINT `chk_budget_amount` CHECK (`amount` > 0),
  CONSTRAINT `fk_budget_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='月度预算表';

-- =============================================================
--  脚本结束
--  说明：
--   1. 默认分类模板（个人/经营）不在此静态脚本中，由后端在「注册成功」
--      时按用户所选场景动态插入 category 表（见同目录 README.md 的模板清单）。
--   2. 登录态以 token（JWT，无状态）承载，无需建 session 表；如后端选
--      用服务端会话方案，可另加 user_token 表。
-- =============================================================
