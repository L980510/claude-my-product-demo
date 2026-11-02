-- =============================================================
-- 一次性迁移：清理 category 表历史重复 + 增加唯一约束
-- 背景：mergeTemplate 存在并发竞态（TOCTOU），导致同一用户同 name+type
--       的分类被插入多遍；且 category 表此前缺唯一约束兜底。
-- 处理：保留每组 (user_id,name,type) 中 id 最小的一条，其余行的流水
--       归并到保留行后删除，最后加唯一约束防止再次产生。
-- 幂等：可重复执行（重复组清理完后 HAVING COUNT(*)>1 不再命中，
--       唯一约束已存在时 ALTER 会报错，执行前先确认）。
-- =============================================================

-- 1) 计算需要删除的重复行（每组保留 id 最小的一条）
DROP TEMPORARY TABLE IF EXISTS tmp_dup_del;
CREATE TEMPORARY TABLE tmp_dup_del AS
SELECT c.id AS del_id, k.keep_id
FROM category c
JOIN (
    SELECT user_id, name, type, MIN(id) AS keep_id
    FROM category
    GROUP BY user_id, name, type
    HAVING COUNT(*) > 1
) k
  ON c.user_id = k.user_id
 AND c.name = k.name
 AND c.type = k.type
 AND c.id <> k.keep_id;

-- 2) 把将删除分类下的流水归并到保留行
UPDATE record r
JOIN tmp_dup_del t ON r.category_id = t.del_id
SET r.category_id = t.keep_id;

-- 3) 修正 user 表的软引用（last_*_category_id），指向保留行
UPDATE user u
JOIN tmp_dup_del t ON u.last_expense_category_id = t.del_id
SET u.last_expense_category_id = t.keep_id;
UPDATE user u
JOIN tmp_dup_del t ON u.last_income_category_id = t.del_id
SET u.last_income_category_id = t.keep_id;

-- 4) 删除重复分类
DELETE c FROM category c
JOIN tmp_dup_del t ON c.id = t.del_id;

-- 5) 加唯一约束兜底，杜绝再次产生
ALTER TABLE category ADD UNIQUE KEY uk_category_user_name_type (user_id, name, type);

DROP TEMPORARY TABLE IF EXISTS tmp_dup_del;
