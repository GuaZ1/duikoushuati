package com.shuati.mapper;

import com.shuati.entity.QuestionFeedback;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;

@Mapper
public interface FeedbackMapper {

    @Insert("INSERT INTO question_feedback (question_id, user_id, content, status, created_at) " +
            "VALUES (#{questionId}, #{userId}, #{content}, #{status}, #{createdAt})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(QuestionFeedback feedback);
}
