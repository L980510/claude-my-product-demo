package com.xjz.dto;

import com.xjz.entity.User;
import lombok.Data;

@Data
public class UserVO {

    private Long id;
    private String username;
    private String scene;
    private Long lastExpenseCategoryId;
    private Long lastIncomeCategoryId;

    public static UserVO from(User u) {
        UserVO vo = new UserVO();
        vo.id = u.getId();
        vo.username = u.getUsername();
        vo.scene = u.getScene();
        vo.lastExpenseCategoryId = u.getLastExpenseCategoryId();
        vo.lastIncomeCategoryId = u.getLastIncomeCategoryId();
        return vo;
    }
}
