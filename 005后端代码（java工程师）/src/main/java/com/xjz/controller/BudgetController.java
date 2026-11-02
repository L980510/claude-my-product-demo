package com.xjz.controller;

import com.xjz.common.Result;
import com.xjz.dto.BudgetRequest;
import com.xjz.entity.Budget;
import com.xjz.security.UserPrincipal;
import com.xjz.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/budget")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    public Result<Budget> get(@AuthenticationPrincipal UserPrincipal principal,
                              @RequestParam String month) {
        return Result.ok(budgetService.get(principal.id(), month));
    }

    @PutMapping
    public Result<Budget> upsert(@AuthenticationPrincipal UserPrincipal principal,
                                 @Valid @RequestBody BudgetRequest req) {
        return Result.ok(budgetService.upsert(principal.id(), req));
    }
}
