# 消费记账 · 数据库设计说明

本目录存放「消费记账」项目的数据库初始化脚本，依据 PRD v1.3 第 6 章「数据需求」与前端 V1（`003.前端代码（前端工程师）/front`）的实际数据模型设计。

## 一、文件清单

| 文件 | 说明 |
| --- | --- |
| `schema.sql` | 建库 + 建表 DDL 脚本（含索引、外键、约束、注释） |

## 二、执行方式

数据库使用本项目 Docker 部署的 MySQL 8.4（容器名 `mysql8`，root 密码 `123456`）：

```bash
# 在脚本所在目录执行
docker exec -i mysql8 mysql -uroot -p123456 < schema.sql

# 验证
docker exec -it mysql8 mysql -uroot -p123456 -e "USE xjz; SHOW TABLES;"
```

> ⚠️ `schema.sql` 包含 `DROP TABLE IF EXISTS`，会删除同名表及数据，仅用于新建/重建环境。

## 三、表结构总览

| 表 | 中文名 | 说明 |
| --- | --- | --- |
| `user` | 用户账号表 | 注册登录、场景模板、记住上次分类 |
| `category` | 分类表 | 每用户独立，预设 + 自定义 |
| `record` | 账单流水表 | 收支流水（核心表），金额以「分」存储 |
| `budget` | 月度预算表 | 每用户每月一条预算 |
| `book` | 账本表 | **预留**（P2 多账本，V1 不启用） |

**实体关系**：

```
user 1 ──< category
user 1 ──< record >── category
user 1 ──< budget
user 1 ──< book（预留） ──< record.book_id（预留）
```

所有业务表均以 `user_id` 归属用户，保证「多用户数据隔离」（PRD 非功能需求）。

## 四、关键设计决策

| 决策点 | 方案 | 理由 |
| --- | --- | --- |
| 金额 | `INT UNSIGNED`，单位「分」 | PRD 约定整数存储，避免浮点误差；上限约 4200 万元，足够 |
| 字符集 | `utf8mb4` / `utf8mb4_0900_ai_ci` | 分类图标是 emoji，必须 utf8mb4；MySQL 8.x 默认排序规则 |
| 密码 | `password_hash VARCHAR(255)`，bcrypt/argon2 | PRD 要求加盐哈希，绝不落明文 |
| 主键 | `BIGINT UNSIGNED AUTO_INCREMENT` | 自增主键，容量充足 |
| 类型/场景 | `ENUM('expense','income')` / `ENUM('personal','business')` | 取值固定，可读性好 |
| 删除策略 | `user`→子表 `ON DELETE CASCADE`；`record`→`category` `ON DELETE RESTRICT` | 注销账号级联清数据；删分类前必须由应用先把流水转移，防止孤儿数据 |
| lastCat | `user` 表内两个软引用字段（无外键） | 「记住上次分类」是弱引用，分类被删后应自动回退，而非报外键错误 |
| 登录态 | 不建 session 表 | 用 JWT（无状态 token）承载，符合「轻量后端」定位 |

## 五、默认分类模板（注册时由后端按场景动态插入）

PRD 3.3 定义两套场景模板，注册成功后由后端写入 `category` 表（`is_system=1`，`scene` 为对应值），非静态种子数据。清单如下（名称/图标/颜色与前端 `app.js` 的 `TEMPLATES` 完全一致）：

### 个人 / 家庭（scene = personal）

**支出**：

| 名称 | 图标 | 颜色 |
| --- | --- | --- |
| 餐饮 | 🍜 | #E8577F |
| 交通 | 🚌 | #A05AD9 |
| 购物 | 🛍️ | #F28A3E |
| 居住 | 🏠 | #35A87C |
| 娱乐 | 🎮 | #D9A81E |
| 医疗 | 💊 | #3F91D6 |
| 教育 | 📚 | #C14B86 |
| 人情 | 🎁 | #82B440 |
| 其他 | 📦 | #7B6CC0 |

**收入**：工资 💰 #35A87C、奖金 🎉 #82B440、理财 📈 #3F91D6、红包 🧧 #E8577F、其他 📦 #7B6CC0

### 经营 / 个体户（scene = business）

**支出**：

| 名称 | 图标 | 颜色 |
| --- | --- | --- |
| 进货采购 | 📦 | #E8577F |
| 房租 | 🏪 | #A05AD9 |
| 水电 | 💡 | #F28A3E |
| 人工 | 👥 | #35A87C |
| 物流 | 🚚 | #D9A81E |
| 耗材 | 🧾 | #3F91D6 |
| 税费 | 🧮 | #C14B86 |
| 其他 | 📦 | #7B6CC0 |

**收入**：销售收入 🛒 #35A87C、服务收入 🛠️ #3F91D6、其他 📦 #7B6CC0

## 六、待后续版本扩展

- **P2 多账本**：启用 `book` 表与 `record.book_id`。
- **P3 多人共享 / 成员**：需新增 `member` / `share` 等表（当前仅 `user_id` 单归属）。
- **P1 搜索筛选**：若按备注模糊检索量增大，可对 `record.note` 增加全文索引或考虑其他检索方案。
