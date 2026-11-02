package com.xjz.controller;

import com.xjz.common.Result;
import com.xjz.dto.CategoryRequest;
import com.xjz.entity.Category;
import com.xjz.security.UserPrincipal;
import com.xjz.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public Result<List<Category>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return Result.ok(categoryService.listByUser(principal.id()));
    }

    @PostMapping
    public Result<Category> create(@AuthenticationPrincipal UserPrincipal principal,
                                   @Valid @RequestBody CategoryRequest req) {
        return Result.ok(categoryService.create(principal.id(), req));
    }

    @PutMapping("/{id}")
    public Result<Category> update(@AuthenticationPrincipal UserPrincipal principal,
                                   @PathVariable Long id,
                                   @Valid @RequestBody CategoryRequest req) {
        return Result.ok(categoryService.update(principal.id(), id, req));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@AuthenticationPrincipal UserPrincipal principal,
                               @PathVariable Long id) {
        categoryService.delete(principal.id(), id);
        return Result.ok();
    }
}
