package com.xjz.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xjz.common.BizException;
import com.xjz.dto.AuthResponse;
import com.xjz.dto.LoginRequest;
import com.xjz.dto.RegisterRequest;
import com.xjz.dto.UserVO;
import com.xjz.entity.User;
import com.xjz.mapper.UserMapper;
import com.xjz.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserMapper userMapper, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest req) {
        Long count = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getUsername, req.getUsername()));
        if (count != null && count > 0) {
            throw new BizException("用户名已存在");
        }
        User u = new User();
        u.setUsername(req.getUsername());
        u.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        userMapper.insert(u);
        return build(u);
    }

    public AuthResponse login(LoginRequest req) {
        User u = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, req.getUsername()));
        if (u == null || !passwordEncoder.matches(req.getPassword(), u.getPasswordHash())) {
            throw new BizException(401, "用户名或密码错误");
        }
        return build(u);
    }

    private AuthResponse build(User u) {
        return new AuthResponse(jwtUtil.generate(u.getId(), u.getUsername()), UserVO.from(u));
    }
}
