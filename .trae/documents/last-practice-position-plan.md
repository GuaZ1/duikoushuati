# 回到上次刷题位置实现计划

## 上下文

刷题小程序需要在首页展示“回到上次刷题的位置”。当前后端已具备答题记录（`answer_record`）和按知识点的学习统计（`study_progress`），但没有按用户+科目维度记录“最近一次做到哪道题”的数据。因此需要新增一张轻量表，并在用户提交答案时更新，同时暴露查询接口供首页调用。

## 方案

### 1. 数据库表

新增 `user_last_practice` 表，按 `user_id + subject_id` 唯一，记录最近一次练习的题目与时间：

```sql
CREATE TABLE user_last_practice (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    last_practice_at DATETIME NOT NULL,
    UNIQUE KEY uk_user_subject (user_id, subject_id),
    KEY idx_user_time (user_id, last_practice_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

独立建表理由：`study_progress` 是按知识点聚合的统计表，加入“最近题目”会破坏其聚合语义，并导致同一科目下多个知识点出现重复记录。

### 2. 新增 Java 文件

| 文件 | 职责 |
|------|------|
| `entity/UserLastPractice.java` | 对应新表 |
| `mapper/UserLastPracticeMapper.java` | 按 user_id + subject_id 查询、插入、更新 |
| `dto/LastPracticePositionDto.java` | 返回给首页的数据结构 |
| `service/PracticePositionService.java` | 查询最近练习位置的服务接口 |
| `service/impl/PracticePositionServiceImpl.java` | 实现：读取记录、校验题目与科目有效性、组装 DTO |
| `controller/PracticeController.java` | 暴露 `GET /api/practice/last-position` |

### 3. 修改现有文件

| 文件 | 修改内容 |
|------|----------|
| `service/impl/AsyncAnswerService.java` | 新增 `updateLastPracticePosition(userId, subjectId, questionId)` 方法，异步 upsert `user_last_practice` |
| `service/impl/AnswerServiceImpl.java` | 在 `submitAnswer` 中答题记录和 `StudyProgress` 更新后，调用上述异步方法 |
| `resources/schema.sql` | 新增 `user_last_practice` 建表语句 |

### 4. 接口与 DTO

- **URL**：`GET /api/practice/last-position`
- **返回**：`ApiResult<LastPracticePositionDto>`
- **DTO 字段**：
  - `subjectId`
  - `subjectName`
  - `questionId`
  - `lastPracticeAt`
  - `valid`（题目是否仍存在，若已被删除则 false）

无记录时返回 `data: null`；未登录由 `AuthInterceptor` 返回 401；题目被删除时 `valid=false`，前端可提示失效并让用户重新选择科目刷题。

### 5. 关键实现细节

- 更新逻辑：先 `findByUserIdAndSubjectId`，不存在则 insert，存在则 update `question_id` 和 `last_practice_at`。
- 查询逻辑：取该用户 `last_practice_at` 最新的一条记录（由于更新时就是按时间覆盖，也可直接按 user_id 查询最新一条），再用 `SubjectMapper.findById` 和 `QuestionCacheService.getQuestionById` 校验并补充名称。
- 保持异步：与现有 `updateStudyProgress`、`updateWrongNotebook` 一致，避免影响答题提交接口响应时间。

## 验证

1. 重新执行 `schema.sql` 或单独执行新增建表语句。
2. 启动后端服务。
3. 调用 `POST /api/answers` 提交一道题的答案。
4. 调用 `GET /api/practice/last-position`，验证返回的科目名称、题目 ID 与刚才答题一致。
5. 删除对应题目后再次查询，验证 `valid=false`。
