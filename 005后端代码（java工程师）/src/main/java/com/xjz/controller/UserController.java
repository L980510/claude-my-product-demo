package com.xjz.controller;

import com.xjz.common.Result;
import com.xjz.dto.SceneRequest;
import com.xjz.dto.SceneResponse;
import com.xjz.dto.UserVO;
import com.xjz.security.UserPrincipal;
import com.xjz.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public Result<UserVO> me(@AuthenticationPrincipal UserPrincipal principal) {
        return Result.ok(userService.me(principal.id()));
    }

    @PutMapping("/scene")
    public Result<SceneResponse> setScene(@AuthenticationPrincipal UserPrincipal principal,
                                          @Valid @RequestBody SceneRequest req) {
        return Result.ok(userService.setScene(principal.id(), req.getScene()));
    }
}
