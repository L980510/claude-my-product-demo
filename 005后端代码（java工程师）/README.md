# xjz-backend（消费记账后端服务）

为「消费记账」产品提供 API 接口的 Java Web 后端，与
`003.前端代码（前端工程师）/front` 配合使用，数据存储于
`004.数据库脚本(数据库管理员DBA)` 中的 MySQL 数据库 `xjz`。

## 技术栈

| 项 | 选型 |
|---|---|
| 框架 | Spring Boot 3.5.x |
| 构建 | Maven |
| JDK | 21 LTS |
| ORM | MyBatis-Plus 3.5.7（`mybatis-plus-spring-boot3-starter`） |
| 数据库 | MySQL 8.4（Docker，宿主机端口 3307） |
| 其他 | Lombok、Spring Validation |

## 目录结构

```
005后端代码（java工程师）
├── pom.xml
├── .gitignore
└── src/main
    ├── java/com/xjz
    │   ├── XjzApplication.java      # 启动入口（@MapperScan）
    │   ├── common/Result.java        # 统一响应包装
    │   ├── config/                   # 分页插件、跨域等配置
    │   ├── controller/               # 健康检查（API 陆续补充）
    │   ├── entity/                   # 5 张表对应的实体
    │   └── mapper/                   # MyBatis-Plus BaseMapper
    └── resources/application.yml     # 端口、数据源、MyBatis-Plus 配置
```

## 运行前准备

1. **JDK 21**：本项目要求 JDK 17+（选定 21）。本机 `JAVA_HOME` 当前指向 JDK 8，
   构建前需先指向 JDK 21（例如 `F:\Program Files\Java\jdk-21`），否则 Maven 编译会失败。
2. **数据库**：确保 Docker 中的 MySQL 8.4 已启动，且 `xjz` 库已初始化：
   ```bash
   docker start mysql8
   # 若尚未建库：docker exec -i mysql8 mysql -uroot -p123456 < ../004.数据库脚本(数据库管理员DBA)/schema.sql
   ```
   连接信息见 `application.yml`（`127.0.0.1:3307/xjz`，root / 123456，仅供本地开发）。

## 运行

```bash
# 构建并启动（建议先保证 Maven 使用 JDK 21）
mvn spring-boot:run
```

启动后服务监听 `http://localhost:8080`。

### 健康检查

```bash
curl http://localhost:8080/api/health
# 期望返回：{"code":0,"message":"success","data":"ok, database connected, SELECT 1 = 1"}
```

该接口同时验证服务与数据库连通性。

## 约定

- **金额单位统一为「分」**（`Long`），与前端及数据库一致。
- **统一响应结构**：`{ code, message, data }`，`code=0` 表示成功。
- 实体字段采用驼峰命名，通过 `map-underscore-to-camel-case` 自动映射数据库下划线字段。
- `created_at` / `updated_at` 由数据库 `DEFAULT CURRENT_TIMESTAMP` / `ON UPDATE CURRENT_TIMESTAMP`
  自动维护（MyBatis-Plus 默认不写入 null 字段）。

## 下一步（待实现）

- 认证与鉴权：注册 / 登录，JWT + Spring Security，密码加盐哈希
- 业务 API：分类（含系统预置模板）、收支记录（增删改查 + 分页）、月度预算、统计
- 统一异常处理（`common` 下补充全局异常处理器与错误码）
- 逻辑删除、字段自动填充（`created_at`/`updated_at`）

> 网络提示：若 Maven Central 下载缓慢，可在 Maven `settings.xml` 配置阿里云镜像
> `https://maven.aliyun.com/repository/public`。
