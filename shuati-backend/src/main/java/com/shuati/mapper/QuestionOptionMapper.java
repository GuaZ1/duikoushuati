package com.shuati.mapper;

import com.shuati.entity.QuestionOption;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface QuestionOptionMapper {

    @Select("SELECT * FROM question_option WHERE question_id = #{questionId}")
    List<QuestionOption> findByQuestionId(Long questionId);

    @Insert("INSERT INTO question_option (question_id, option_key, content, is_correct) " +
            "VALUES (#{questionId}, #{optionKey}, #{content}, #{isCorrect})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(QuestionOption option);

    @Delete("DELETE FROM question_option WHERE question_id = #{questionId}")
    int deleteByQuestionId(Long questionId);
}
