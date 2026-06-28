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

    @Insert("INSERT INTO study_progress (user_id, subject_id, knowledge_point_id, practiced_count, correct_count, mastery_rate) " +
            "VALUES (#{userId}, #{subjectId}, #{knowledgePointId}, #{practicedCount}, #{correctCount}, #{masteryRate})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(StudyProgress progress);

    @Update("UPDATE study_progress SET practiced_count = #{practicedCount}, correct_count = #{correctCount}, mastery_rate = #{masteryRate} " +
            "WHERE id = #{id}")
    int update(StudyProgress progress);
}
