package com.shuati.mapper;

import com.shuati.dto.QuestionPracticeVo;
import com.shuati.entity.Question;
import com.shuati.enums.QuestionType;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface QuestionMapper {

    @Select("SELECT * FROM question WHERE id = #{id}")
    Question findById(Long id);

    @Select("<script>SELECT * FROM question WHERE id IN " +
            "<foreach collection='ids' item='id' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            "</script>")
    List<Question> findByIds(@Param("ids") List<Long> ids);

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

    @Select("<script>" +
            "SELECT q.id AS question_id, q.subject_id, s.name AS subject_name, " +
            "q.type, q.difficulty, q.content, q.answer, q.analysis, q.score, " +
            "q.knowledge_point_ids, q.source, " +
            "o.id AS option_id, o.option_key, o.content AS option_content, o.is_correct " +
            "FROM question q " +
            "LEFT JOIN subject s ON q.subject_id = s.id " +
            "LEFT JOIN question_option o ON q.id = o.question_id " +
            "<where>" +
            "<if test='subjectId != null'>AND q.subject_id = #{subjectId}</if>" +
            "<if test='difficulty != null'>AND q.difficulty = #{difficulty}</if>" +
            "<if test='type != null'>AND q.type = #{type}</if>" +
            "</where>" +
            "ORDER BY q.id, o.option_key" +
            "</script>")
    List<QuestionPracticeVo> findPracticeQuestionsByConditions(@Param("subjectId") Long subjectId,
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
