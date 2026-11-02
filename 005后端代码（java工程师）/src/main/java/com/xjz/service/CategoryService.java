package com.xjz.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.xjz.common.BizException;
import com.xjz.dto.CategoryRequest;
import com.xjz.entity.Category;
import com.xjz.entity.Record;
import com.xjz.mapper.CategoryMapper;
import com.xjz.mapper.RecordMapper;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryMapper categoryMapper;
    private final RecordMapper recordMapper;

    public CategoryService(CategoryMapper categoryMapper, RecordMapper recordMapper) {
        this.categoryMapper = categoryMapper;
        this.recordMapper = recordMapper;
    }

    public List<Category> listByUser(Long userId) {
        return categoryMapper.selectList(new LambdaQueryWrapper<Category>()
                .eq(Category::getUserId, userId)
                .orderByAsc(Category::getType)
                .orderByAsc(Category::getSortOrder));
    }

    public Category create(Long userId, CategoryRequest req) {
        checkDup(userId, null, req.getName(), req.getType());
        Category c = new Category();
        c.setUserId(userId);
        c.setName(req.getName());
        c.setType(req.getType());
        c.setIcon(req.getIcon());
        c.setColor(req.getColor());
        c.setSortOrder(nextSort(userId, req.getType()));
        c.setIsSystem(false);
        try {
            categoryMapper.insert(c);
        } catch (DuplicateKeyException e) {
            throw new BizException("该类型下已存在同名分类");
        }
        return c;
    }

    public Category update(Long userId, Long id, CategoryRequest req) {
        Category c = getOwned(userId, id);
        checkDup(userId, id, req.getName(), req.getType());
        if (!c.getType().equals(req.getType())) {
            Long linked = recordMapper.selectCount(
                    new LambdaQueryWrapper<Record>().eq(Record::getCategoryId, id));
            if (linked != null && linked > 0) {
                throw new BizException("该分类下已有流水，不能修改类型");
            }
        }
        Category upd = new Category();
        upd.setId(id);
        upd.setName(req.getName());
        upd.setType(req.getType());
        upd.setIcon(req.getIcon());
        upd.setColor(req.getColor());
        try {
            categoryMapper.updateById(upd);
        } catch (DuplicateKeyException e) {
            throw new BizException("该类型下已存在同名分类");
        }
        return categoryMapper.selectById(id);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        Category c = getOwned(userId, id);
        if (Boolean.TRUE.equals(c.getIsSystem()) && "其他".equals(c.getName())) {
            throw new BizException("「其他」分类不可删除");
        }
        Long linked = recordMapper.selectCount(
                new LambdaQueryWrapper<Record>().eq(Record::getCategoryId, id));
        if (linked != null && linked > 0) {
            Category other = categoryMapper.selectOne(new LambdaQueryWrapper<Category>()
                    .eq(Category::getUserId, userId)
                    .eq(Category::getType, c.getType())
                    .eq(Category::getIsSystem, true)
                    .eq(Category::getName, "其他"));
            if (other == null) {
                throw new BizException("缺少「其他」分类，无法转移流水");
            }
            Record upd = new Record();
            upd.setCategoryId(other.getId());
            recordMapper.update(upd, new LambdaUpdateWrapper<Record>().eq(Record::getCategoryId, id));
        }
        categoryMapper.deleteById(id);
    }

    /** 合并场景模板中缺失的分类（按 name+type 去重），首次选择与切换场景通用 */
    @Transactional
    public void mergeTemplate(Long userId, String scene) {
        List<Category> existing = categoryMapper.selectList(
                new LambdaQueryWrapper<Category>().eq(Category::getUserId, userId));
        int sort = existing.stream()
                .mapToInt(c -> c.getSortOrder() == null ? 0 : c.getSortOrder())
                .max().orElse(0);
        for (CategoryTemplates.Item it : CategoryTemplates.items(scene)) {
            boolean exists = existing.stream().anyMatch(
                    c -> c.getName().equals(it.name()) && c.getType().equals(it.type()));
            if (exists) {
                continue;
            }
            Category c = new Category();
            c.setUserId(userId);
            c.setName(it.name());
            c.setType(it.type());
            c.setIcon(it.icon());
            c.setColor(it.color());
            c.setSortOrder(++sort);
            c.setIsSystem(true);
            c.setScene(scene);
            try {
                categoryMapper.insert(c);
            } catch (DuplicateKeyException e) {
                // 并发下已被其它请求插入同 name+type，忽略
            }
        }
    }

    private Category getOwned(Long userId, Long id) {
        Category c = categoryMapper.selectById(id);
        if (c == null || !c.getUserId().equals(userId)) {
            throw new BizException("分类不存在");
        }
        return c;
    }

    private void checkDup(Long userId, Long excludeId, String name, String type) {
        Long count = categoryMapper.selectCount(new LambdaQueryWrapper<Category>()
                .eq(Category::getUserId, userId)
                .eq(Category::getName, name)
                .eq(Category::getType, type)
                .ne(excludeId != null, Category::getId, excludeId));
        if (count != null && count > 0) {
            throw new BizException("该类型下已存在同名分类");
        }
    }

    private int nextSort(Long userId, String type) {
        List<Category> list = categoryMapper.selectList(new LambdaQueryWrapper<Category>()
                .eq(Category::getUserId, userId)
                .eq(Category::getType, type));
        return list.stream()
                .mapToInt(c -> c.getSortOrder() == null ? 0 : c.getSortOrder())
                .max().orElse(0) + 1;
    }
}
