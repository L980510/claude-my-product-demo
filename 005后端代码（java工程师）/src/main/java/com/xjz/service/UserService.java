package com.xjz.service;

import com.xjz.common.BizException;
import com.xjz.dto.SceneResponse;
import com.xjz.dto.UserVO;
import com.xjz.entity.User;
import com.xjz.mapper.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserMapper userMapper;
    private final CategoryService categoryService;

    public UserService(UserMapper userMapper, CategoryService categoryService) {
        this.userMapper = userMapper;
        this.categoryService = categoryService;
    }

    public UserVO me(Long userId) {
        User u = userMapper.selectById(userId);
        if (u == null) {
            throw new BizException(401, "用户不存在");
        }
        return UserVO.from(u);
    }

    @Transactional
    public SceneResponse setScene(Long userId, String scene) {
        User u = userMapper.selectById(userId);
        if (u == null) {
            throw new BizException(401, "用户不存在");
        }
        User upd = new User();
        upd.setId(userId);
        upd.setScene(scene);
        userMapper.updateById(upd);

        categoryService.mergeTemplate(userId, scene);
        return new SceneResponse(scene, categoryService.listByUser(userId));
    }
}
