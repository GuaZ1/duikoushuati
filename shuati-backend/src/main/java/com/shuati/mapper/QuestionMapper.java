package com.shuati.mapper;

import com.shuati.entity.Question;
import com.shuati.enums.QuestionType;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface QuestionMapper {

    @Select("SELECT * FROM question WHERE id = #{id}")
    Question findById(Long id);

    @Select("<script>SELECT * FROM question " +
            "<where>" +
            "<if test='subjectId != null'>AND subject_id = #{subjectId}</if>" +
            "<if test='difficulty != null'>AND difficulty = #{difficulty}</if>" +
            "<if test='type != null'>AND type = #{type}</if>" +
            "</where>" +
            "ORDER BY id" +
            "</script>")
    List<Question> findByConditions(@Param("subjectId") Long subjectId,
                                    @Param("difficulty") Integer difficulty,
                                    @Param("type") QuestionType type);

    @Insert("INSERT INTO question (subject_id, knowledge_point_ids, type, difficulty, content, answer, analysis, score, source) " +
            "VALUES (#{subjectId}, #{knowledgePointIds}, #{type}, #{difficulty}, #{content}, #{answer}, #{analysis}, #{score}, #{source})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Question question);

    @Update("UPDATE question SET subject_id = #{subjectId}, knowledge_point_ids = #{knowledgePointIds}, " +
            "type = #{type}, difficulty = #{difficulty}, content = #{content}, answer = #{answer}, " +
            "analysis = #{analysis}, score = #{score}, source = #{source} WHERE id = #{id}")
    int update(Question question);

    @Delete("DELETE FROM question WHERE id = #{id}")
    int deleteById(Long id);
}
