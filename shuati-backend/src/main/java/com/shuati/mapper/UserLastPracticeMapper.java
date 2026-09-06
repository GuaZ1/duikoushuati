package com.shuati.mapper;

import com.shuati.entity.UserLastPractice;
import org.apache.ibatis.annotations.*;

@Mapper
public interface UserLastPracticeMapper {

    @Select("SELECT * FROM user_last_practice WHERE user_id = #{userId} AND subject_id = #{subjectId}")
    UserLastPractice findByUserIdAndSubjectId(@Param("userId") Long userId,
                                              @Param("subjectId") Long subjectId);

    @Select("SELECT * FROM user_last_practice WHERE user_id = #{userId} ORDER BY last_practice_at DESC LIMIT 1")
    UserLastPractice findLatestByUserId(@Param("userId") Long userId);

    // 原子写入「上次刷题位置」：按 uk_user_subject 判定，已存在则更新题目与时间，
    // 并发作答不会出现撞唯一键/覆盖丢失。
    @Insert("INSERT INTO user_last_practice (user_id, subject_id, question_id, last_practice_at) " +
            "VALUES (#{userId}, #{subjectId}, #{questionId}, NOW()) " +
            "ON DUPLICATE KEY UPDATE question_id = #{questionId}, last_practice_at = NOW()")
    int upsertPosition(@Param("userId") Long userId,
                       @Param("subjectId") Long subjectId,
                       @Param("questionId") Long questionId);

    @Insert("INSERT INTO user_last_practice (user_id, subject_id, question_id, last_practice_at) " +
            "VALUES (#{userId}, #{subjectId}, #{questionId}, #{lastPracticeAt})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(UserLastPractice position);

    @Update("UPDATE user_last_practice SET question_id = #{questionId}, last_practice_at = #{lastPracticeAt} " +
            "WHERE id = #{id}")
    int update(UserLastPractice position);
}
