package com.xjz.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xjz.common.BizException;
import com.xjz.dto.RecordRequest;
import com.xjz.entity.Category;
import com.xjz.entity.Record;
import com.xjz.entity.User;
import com.xjz.mapper.CategoryMapper;
import com.xjz.mapper.RecordMapper;
import com.xjz.mapper.UserMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
public class RecordService {

    private final RecordMapper recordMapper;
    private final CategoryMapper categoryMapper;
    private final UserMapper userMapper;

    public RecordService(RecordMapper recordMapper, CategoryMapper categoryMapper, UserMapper userMapper) {
        this.recordMapper = recordMapper;
        this.categoryMapper = categoryMapper;
        this.userMapper = userMapper;
    }

    public List<Record> list(Long userId, String month, String start, String end) {
        LambdaQueryWrapper<Record> q = new LambdaQueryWrapper<Record>().eq(Record::getUserId, userId);
        if (month != null && !month.isBlank()) {
            YearMonth ym = YearMonth.parse(month);
            q.ge(Record::getRecordDate, ym.atDay(1)).le(Record::getRecordDate, ym.atEndOfMonth());
        } else if (start != null && !start.isBlank() && end != null && !end.isBlank()) {
            q.ge(Record::getRecordDate, LocalDate.parse(start)).le(Record::getRecordDate, LocalDate.parse(end));
        }
        q.orderByDesc(Record::getRecordDate).orderByDesc(Record::getId);
        return recordMapper.selectList(q);
    }

    public Record create(Long userId, RecordRequest req) {
        checkCategory(userId, req.getCategoryId(), req.getType());
        Record r = new Record();
        r.setUserId(userId);
        r.setType(req.getType());
        r.setAmount(req.getAmount());
        r.setCategoryId(req.getCategoryId());
        r.setNote(req.getNote());
        r.setRecordDate(LocalDate.parse(req.getDate()));
        recordMapper.insert(r);
        updateLastCategory(userId, req.getType(), req.getCategoryId());
        return r;
    }

    public Record update(Long userId, Long id, RecordRequest req) {
        getOwned(userId, id);
        checkCategory(userId, req.getCategoryId(), req.getType());
        Record upd = new Record();
        upd.setId(id);
        upd.setType(req.getType());
        upd.setAmount(req.getAmount());
        upd.setCategoryId(req.getCategoryId());
        upd.setNote(req.getNote());
        upd.setRecordDate(LocalDate.parse(req.getDate()));
        recordMapper.updateById(upd);
        updateLastCategory(userId, req.getType(), req.getCategoryId());
        return recordMapper.selectById(id);
    }

    public void delete(Long userId, Long id) {
        Record r = getOwned(userId, id);
        recordMapper.deleteById(r.getId());
    }

    private void checkCategory(Long userId, Long categoryId, String type) {
        Category c = categoryMapper.selectById(categoryId);
        if (c == null || !c.getUserId().equals(userId)) {
            throw new BizException("分类不存在");
        }
        if (!c.getType().equals(type)) {
            throw new BizException("分类类型与收支类型不一致");
        }
    }

    private Record getOwned(Long userId, Long id) {
        Record r = recordMapper.selectById(id);
        if (r == null || !r.getUserId().equals(userId)) {
            throw new BizException("记录不存在");
        }
        return r;
    }

    private void updateLastCategory(Long userId, String type, Long categoryId) {
        User u = new User();
        u.setId(userId);
        if ("expense".equals(type)) {
            u.setLastExpenseCategoryId(categoryId);
        } else {
            u.setLastIncomeCategoryId(categoryId);
        }
        userMapper.updateById(u);
    }
}
