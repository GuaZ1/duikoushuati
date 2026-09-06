package com.shuati.mapper;

import com.shuati.entity.StudyProgress;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface StudyProgressMapper {

    @Select("SELECT * FROM study_progress WHERE user_id = #{userId} AND subject_id = #{subjectId} AND knowledge_point_id = #{knowledgePointId}")
    StudyProgress findByUserIdAndSubjectIdAndKnowledgePointId(@Param("userId") Long userId,
                                                              @Param("subjectId") Long subjectId,
                                                              @Param("knowledgePointId") Long knowledgePointId);

    @Select("SELECT * FROM study_progress WHERE user_id = #{userId} AND subject_id = #{subjectId}")
    List<StudyProgress> findByUserIdAndSubjectId(@Param("userId") Long userId, @Param("subjectId") Long subjectId);

    // 原子累计练习/正确次数：无记录直接插入（首答），已有记录在行锁内 +1。
    // 与 recalcMastery 在同一个事务里先后执行，行锁保证同知识点并发作答也不会丢更新。
    @Insert("INSERT INTO study_progress (user_id, subject_id, knowledge_point_id, practiced_count, correct_count, mastery_rate) " +
            "VALUES (#{userId}, #{subjectId}, #{knowledgePointId}, 1, #{correctIncrement}, #{correctIncrement} * 100) " +
            "ON DUPLICATE KEY UPDATE practiced_count = practiced_count + 1, correct_count = correct_count + #{correctIncrement}")
    int upsertCounts(@Param("userId") Long userId,
                     @Param("subjectId") Long subjectId,
                     @Param("knowledgePointId") Long knowledgePointId,
                     @Param("correctIncrement") int correctIncrement);

    // 用最新计数重算掌握率（与原先 Java 整数除法截断语义一致：FLOOR）
    @Update("UPDATE study_progress SET mastery_rate = LEAST(100, FLOOR(correct_count * 100 / practiced_count)) " +
            "WHERE user_id = #{userId} AND subject_id = #{subjectId} AND knowledge_point_id = #{knowledgePointId}")
    int recalcMastery(@Param("userId") Long userId,
                      @Param("subjectId") Long subjectId,
                      @Param("knowledgePointId") Long knowledgePointId);

    @Insert("INSERT INTO study_progress (user_id, subject_id, knowledge_point_id, practiced_count, correct_count, mastery_rate) " +
            "VALUES (#{userId}, #{subjectId}, #{knowledgePointId}, #{practicedCount}, #{correctCount}, #{masteryRate})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(StudyProgress progress);

    @Update("UPDATE study_progress SET practiced_count = #{practicedCount}, correct_count = #{correctCount}, mastery_rate = #{masteryRate} " +
            "WHERE id = #{id}")
    int update(StudyProgress progress);
}
