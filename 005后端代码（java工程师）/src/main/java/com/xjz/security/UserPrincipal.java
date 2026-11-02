package com.xjz.security;

/**
 * 当前登录用户（由 JwtAuthFilter 解析 token 后放入 SecurityContext）
 */
public record UserPrincipal(Long id, String username) {
}
