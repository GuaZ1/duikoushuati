# 对口刷题（Shuati）

一个面向中职/对口升学考试的刷题小程序，包含题目练习、错题本、学习进度统计、教师题目管理等功能。

---

## 技术栈

| 层级 | 技术 |
|---|---|
| 后端 | Spring Boot 3.2 + MyBatis + MySQL + RabbitMQ |
| 前端 | Taro 4.1 + React 18 + TypeScript + Sass |
| 构建工具 | Maven（后端）、Webpack 5 / Taro CLI（前端） |
| 容器化 | Docker + Docker Compose |
| 状态管理 | Zustand |

---

## 项目结构

```
shuati/
├── shuati-backend/          # 后端服务（Spring Boot）
│   ├── src/main/java/         # Java 源码
│   ├── src/main/resources/    # 配置文件、SQL 脚本
│   └── pom.xml
├── shuati-frontend/         # 前端项目（Taro 小程序）
│   ├── src/                   # 页面、组件、接口、状态
│   ├── config/                # Taro 构建配置
│   └── package.json
├── docker-compose.yml       # MySQL、RabbitMQ、Nginx 容器编排
├── nginx.conf               # 静态资源（上传文件）服务配置
├── .env.example             # 环境变量模板
└── README.md
```

---

## 前置要求

- JDK 17+
- Maven 3.9+（或直接用 `./mvnw`）
- Node.js 18+
- MySQL 8.0（也可通过 Docker Compose 启动）
- RabbitMQ 3（也可通过 Docker Compose 启动）
- Docker & Docker Compose（可选，推荐）

---

## 快速启动（推荐：使用 Docker Compose）

### 1. 克隆仓库

```bash
git clone https://github.com/GuaZ1/duikoushuati.git
cd duikoushuati
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填写你的数据库和 RabbitMQ 密码。例如：

```env
MYSQL_URL=jdbc:mysql://mysql:3306/shuati?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai&useSSL=false&connectionCollation=utf8mb4_unicode_ci
MYSQL_USER=root
MYSQL_PASSWORD=你的密码
MYSQL_ROOT_PASSWORD=你的root密码

RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=shuati
RABBITMQ_PASSWORD=你的密码
RABBITMQ_DEFAULT_USER=shuati
RABBITMQ_DEFAULT_PASS=你的密码

SERVER_PORT=8080
TARO_APP_API_URL=http://localhost:8080
```

> 注意：使用 Docker Compose 时，后端连接 MySQL/RabbitMQ 的主机名建议分别使用服务名 `mysql` 和 `rabbitmq`。

### 3. 启动基础服务

```bash
docker-compose up -d
```

这会启动：
- MySQL 8.0（端口 3306）
- RabbitMQ 3 Management（端口 5672、15672）
- Nginx（端口 80，用于上传文件访问）

### 4. 启动后端

```bash
cd shuati-backend
./mvnw spring-boot:run
```

或 Windows：

```bash
.\mvnw.cmd spring-boot:run
```

后端默认运行在 `http://localhost:8080`。

### 5. 启动前端

```bash
cd shuati-frontend
npm install
npm run dev:weapp   # 微信小程序
# 或
npm run dev:h5      # H5
```

---

## 手动启动（不使用 Docker）

如果你已经安装好了 MySQL 和 RabbitMQ：

1. 创建数据库 `shuati`，执行 `shuati-backend/src/main/resources/schema.sql` 和 `data.sql`。
2. 修改 `.env` 中的 `MYSQL_URL`、`RABBITMQ_HOST` 为本地地址（如 `localhost`）。
3. 按上面的步骤启动后端和前端。

---

## 环境变量说明

| 变量 | 说明 | 示例 |
|---|---|---|
| `MYSQL_URL` | JDBC 连接地址 | `jdbc:mysql://mysql:3306/shuati?...` |
| `MYSQL_USER` | MySQL 用户名 | `root` |
| `MYSQL_PASSWORD` | MySQL 密码 | - |
| `MYSQL_ROOT_PASSWORD` | Docker 中 MySQL root 密码 | - |
| `RABBITMQ_HOST` | RabbitMQ 主机 | `rabbitmq` 或 `localhost` |
| `RABBITMQ_PORT` | RabbitMQ 端口 | `5672` |
| `RABBITMQ_USER` | RabbitMQ 用户名 | `shuati` |
| `RABBITMQ_PASSWORD` | RabbitMQ 密码 | - |
| `RABBITMQ_DEFAULT_USER` | Docker 中 RabbitMQ 默认用户 | `shuati` |
| `RABBITMQ_DEFAULT_PASS` | Docker 中 RabbitMQ 默认密码 | - |
| `SERVER_PORT` | 后端服务端口 | `8080` |
| `TARO_APP_API_URL` | 前端请求的后端地址 | `http://localhost:8080` |

---

## 常用命令

### 后端

```bash
# 编译打包
./mvnw clean package

# 运行测试
./mvnw test
```

### 前端

```bash
# 微信小程序开发
npm run dev:weapp

# H5 开发
npm run dev:h5

# 构建微信小程序
npm run build:weapp

# 构建 H5
npm run build:h5
```

---

## 注意事项

1. **不要提交 `.env` 文件**：该文件包含数据库密码等敏感信息，已被 `.gitignore` 忽略。新成员请基于 `.env.example` 创建自己的 `.env`。
2. **密码安全**：首次部署时，请将默认弱密码替换为强密码。
3. **RabbitMQ**：项目当前已将 RabbitMQ 监听器设置为 `auto-startup: false`，如需要消息队列功能请自行调整。
4. **Nginx 上传目录**：`nginx.conf` 将 `/uploads/` 映射到 `uploads/` 目录，用于访问用户上传的图片等资源。

---

## License

MIT
