package com.xjz.controller;

import com.xjz.common.Result;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 健康检查：验证服务启动正常且能连通数据库
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public Result<String> health() {
        Integer one = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        return Result.ok("ok, database connected, SELECT 1 = " + one);
    }
}
