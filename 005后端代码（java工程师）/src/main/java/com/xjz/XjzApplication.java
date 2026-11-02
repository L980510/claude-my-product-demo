package com.xjz;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 消费记账后端服务启动入口
 */
@SpringBootApplication
@MapperScan("com.xjz.mapper")
public class XjzApplication {

    public static void main(String[] args) {
        SpringApplication.run(XjzApplication.class, args);
    }
}
