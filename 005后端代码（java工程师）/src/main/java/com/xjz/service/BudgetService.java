package com.xjz.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xjz.dto.BudgetRequest;
import com.xjz.entity.Budget;
import com.xjz.mapper.BudgetMapper;
import org.springframework.stereotype.Service;

@Service
public class BudgetService {

    private final BudgetMapper budgetMapper;

    public BudgetService(BudgetMapper budgetMapper) {
        this.budgetMapper = budgetMapper;
    }

    public Budget get(Long userId, String month) {
        return budgetMapper.selectOne(new LambdaQueryWrapper<Budget>()
                .eq(Budget::getUserId, userId)
                .eq(Budget::getMonth, month));
    }

    public Budget upsert(Long userId, BudgetRequest req) {
        Budget b = budgetMapper.selectOne(new LambdaQueryWrapper<Budget>()
                .eq(Budget::getUserId, userId)
                .eq(Budget::getMonth, req.getMonth()));
        if (b == null) {
            b = new Budget();
            b.setUserId(userId);
            b.setMonth(req.getMonth());
            b.setAmount(req.getAmount());
            budgetMapper.insert(b);
        } else {
            Budget upd = new Budget();
            upd.setId(b.getId());
            upd.setAmount(req.getAmount());
            budgetMapper.updateById(upd);
            b.setAmount(req.getAmount());
        }
        return b;
    }
}
